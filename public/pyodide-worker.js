/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Load Pyodide from official package CDN
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

let pyodide = null;
let initialized = false;

async function sendStatus(status, message) {
  self.postMessage({ type: 'STATUS', status, message });
}

async function init() {
  if (initialized) {
    await sendStatus('COMPLETED', 'Python environment is fully active!');
    return;
  }
  try {
    await sendStatus('WASM_LOADING', 'Downloading Pyodide WebAssembly runtime...');
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
    });
    
    await sendStatus('MICROPIP_LOADING', 'Initializing Pyodide package manager (micropip)...');
    await pyodide.loadPackage("micropip");
    
    await sendStatus('DEPS_LOADING', 'Loading FastAPI, Pydantic & HTTPX environment (First-time load: 10-15 seconds)...');
    
    // Install requirements
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install(['fastapi', 'pydantic', 'httpx'])
    `);
    
    initialized = true;
    await sendStatus('COMPLETED', 'Python FastAPI sandbox is ready!');
  } catch (err) {
    self.postMessage({ type: 'STATUS', status: 'ERROR', message: `Engine failure: ${err.message}` });
  }
}

self.onmessage = async function(e) {
  const data = e.data;
  
  if (data.type === 'INIT') {
    await init();
    return;
  }
  
  if (!initialized || !pyodide) {
    self.postMessage({ type: 'STATUS', status: 'ERROR', message: 'WASM environment is initializing.' });
    return;
  }
  
  if (data.type === 'RUN_CODE') {
    const { code } = data;
    try {
      // Write the code to virtual file main.py
      pyodide.FS.writeFile("main.py", code, { encoding: "utf8" });
      
      const resultJson = await pyodide.runPythonAsync(`
import sys
import io
import json
import importlib

# Redirect standard output streams to capture them
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = stdout_capture
sys.stderr = stderr_capture

has_app = False
openapi_schema = None
error_msg = None
success = False

try:
    # Clear out module if previously imported for a clean module reload
    if 'main' in sys.modules:
        del sys.modules['main']
        
    import main
    success = True
    
    if hasattr(main, 'app'):
        from fastapi import FastAPI
        if isinstance(main.app, FastAPI):
            has_app = True
            try:
                openapi_schema = main.app.openapi()
            except Exception as o_err:
                openapi_schema = {"error": f"Schema build error: {str(o_err)}"}
except Exception as e:
    import traceback
    traceback.print_exc(file=stderr_capture)
    error_msg = str(e)
    success = False
finally:
    sys.stdout = old_stdout
    sys.stderr = old_stderr

json.dumps({
    "success": success,
    "stdout": stdout_capture.getvalue(),
    "stderr": stderr_capture.getvalue(),
    "has_app": has_app,
    "openapi_schema": openapi_schema,
    "error": error_msg
})
      `);
      
      const res = JSON.parse(resultJson);
      self.postMessage({ type: 'RUN_CODE_RESULT', result: res });
    } catch (err) {
      self.postMessage({ 
        type: 'RUN_CODE_RESULT', 
        result: {
          success: false,
          stdout: "",
          stderr: err.toString(),
          has_app: false,
          error: err.toString()
        } 
      });
    }
  }
  
  if (data.type === 'RUN_TEST') {
    const { testScript } = data;
    try {
      // Direct assignment into variables is safer than script string concatenation
      pyodide.globals.set("__test_script", testScript);
      
      const resultJson = await pyodide.runPythonAsync(`
import sys
import io
import json
import main

stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = stdout_capture
sys.stderr = stderr_capture

test_script = globals().get("__test_script", "")
test_globals = {}
passed = False
message = ""

try:
    exec(test_script, test_globals)
    if 'validate' in test_globals:
        test_res = test_globals['validate'](main)
        if isinstance(test_res, dict):
            passed = test_res.get("passed", False)
            message = test_res.get("message", "")
        elif test_res is True:
            passed = True
            message = "Task completed successfully!"
        else:
            passed = False
            message = "Validation suite returned unexpected format."
    else:
        passed = False
        message = "Critical: 'validate' validation function was missing."
except AssertionError as ae:
    passed = False
    message = str(ae) if str(ae) else "Failing assertion check."
except Exception as e:
    passed = False
    message = f"Validation Script Syntax/Runtime Exception: {str(e)}"
finally:
    sys.stdout = old_stdout
    sys.stderr = old_stderr

json.dumps({
    "passed": passed,
    "message": message,
    "stdout": stdout_capture.getvalue(),
    "stderr": stderr_capture.getvalue()
})
      `);
      
      const res = JSON.parse(resultJson);
      self.postMessage({ type: 'RUN_TEST_RESULT', result: res });
    } catch (err) {
      self.postMessage({
        type: 'RUN_TEST_RESULT',
        result: {
          passed: false,
          message: `Internal validation exception: ${err.message}`,
          stdout: "",
          stderr: err.toString()
        }
      });
    }
  }
  
  if (data.type === 'MOCK_REQUEST') {
    const { method, path, body, headers } = data;
    try {
      pyodide.globals.set("__mock_method", method);
      pyodide.globals.set("__mock_path", path);
      pyodide.globals.set("__mock_body", body || null);
      if (headers) {
        pyodide.globals.set("__mock_headers", pyodide.toPy(headers));
      } else {
        pyodide.globals.set("__mock_headers", null);
      }
      
      const resultJson = await pyodide.runPythonAsync(`
import sys
import io
import json
import main
from fastapi.testclient import TestClient

response_data = {
    "statusCode": 500,
    "headers": {},
    "body": "No active 'app' instance found in main.py. Please define app = FastAPI()."
}

if hasattr(main, 'app'):
    from fastapi import FastAPI
    if isinstance(main.app, FastAPI):
        client = TestClient(main.app)
        
        m_method = globals().get("__mock_method", "GET")
        m_path = globals().get("__mock_path", "/")
        m_body = globals().get("__mock_body", None)
        m_headers = globals().get("__mock_headers", None)
        
        try:
            kwargs = {}
            if m_body:
                try:
                    kwargs['json'] = json.loads(m_body)
                except Exception:
                    kwargs['content'] = m_body
            if m_headers:
                # convert PyProxy elements back to clean python dictionary
                kwargs['headers'] = dict(m_headers)
                
            req_callable = getattr(client, m_method.lower())
            res = req_callable(m_path, **kwargs)
            
            response_data = {
                "statusCode": res.status_code,
                "headers": dict(res.headers),
                "body": res.text
            }
        except Exception as client_err:
            response_data = {
                "statusCode": 500,
                "headers": {},
                "body": f"Failed executing endpoint request: {str(client_err)}"
            }
    else:
        response_data["body"] = "The 'app' attribute exists but is not an instance of fastapi.FastAPI."
else:
    response_data["body"] = "No app decorator instance detected! Define 'app = FastAPI()' in Python Code."

json.dumps(response_data)
      `);
      
      const res = JSON.parse(resultJson);
      self.postMessage({ type: 'MOCK_REQUEST_RESULT', result: res });
    } catch (err) {
      self.postMessage({
        type: 'MOCK_REQUEST_RESULT',
        result: {
          statusCode: 500,
          headers: {},
          body: `Pyodide engine mock request exception: ${err.message}`
        }
      });
    }
  }
};
