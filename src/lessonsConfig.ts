/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson } from './types';

export const LESSONS: Record<string, Lesson> = {
  "first-steps": {
    slug: "first-steps",
    title: "First Steps",
    module: "1. Basics",
    initialCode: `# Welcome to FastAPI Interactive!
# Follow the instructions in the Tasks panel.

from fastapi import FastAPI

app = FastAPI()

# Create a GET endpoint at "/" that returns {"message": "Hello World"}
@app.get("/")
def read_root():
    return {"message": "Hello World"}
`,
    tasks: [
      "Define a FastAPI app instance named 'app'.",
      "Create an operational GET endpoint decorator at the root path '/' (Hint: @app.get('/')).",
      "Implement the path operation function returning a dictionary containing {'message': 'Hello World'}."
    ],
    testScript: `
def validate(main):
    assert hasattr(main, 'app'), "Could not find 'app' instance of FastAPI. Ensure you define: app = FastAPI()"
    from fastapi import FastAPI
    assert isinstance(main.app, FastAPI), "The 'app' variable must be an instance of FastAPI."
    
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    try:
        response = client.get('/')
    except Exception as e:
        raise AssertionError(f"Failed to query the GET endpoint at '/': {str(e)}")
        
    assert response.status_code == 200, f"Expected HTTP status code 200 at '/', got {response.status_code}."
    assert response.json() == {"message": "Hello World"}, f"Expected returned JSON {{'message': 'Hello World'}}, but got {response.json()}"
    
    return {"passed": True, "message": "Excellent! Your very first FastAPI endpoint is successfully configured and running completely in WASM!"}
`,
    hint: "Ensure you import FastAPI as 'from fastapi import FastAPI', launch 'app = FastAPI()', and write a GET decorator @app.get('/') above a standard Python function returning the core message."
  },

  "path-params": {
    slug: "path-params",
    title: "Path Parameters",
    module: "1. Basics",
    initialCode: `from fastapi import FastAPI

app = FastAPI()

# Complete the path parameter route below.
# Set item_id parameter type to 'int' for automatic typing!
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
`,
    tasks: [
      "Keep or define your standard 'app = FastAPI()' instance.",
      "Declare a path parameter 'item_id' in your path decorator: '/items/{item_id}'.",
      "Declare the type of the argument in your path operation function as an integer ('int').",
      "Return a dictionary containing the key-value pair of the retrieved 'item_id'."
    ],
    testScript: `
def validate(main):
    assert hasattr(main, 'app'), "Could not find 'app' instance of FastAPI."
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    # Verify integer request
    res1 = client.get('/items/105')
    assert res1.status_code == 200, f"Expected 200 OK for integer item_id=105, got {res1.status_code}."
    assert res1.json() == {"item_id": 105}, f"Expected returned dict {{'item_id': 105}}, got {res1.json()}."
    
    # Verify path validation works
    res2 = client.get('/items/not-an-int')
    assert res2.status_code == 422, f"Expected status code 422 (Unprocessable Entity) for wrong param type, got {res2.status_code}."
    
    return {"passed": True, "message": "Superb! FastAPI automatically parsed '105' as an integer and outputted a Pydantic Validation Error for 'not-an-int'!"}
`,
    hint: "In python, you declare variables and types like 'param: int'. Thus, use: 'async def read_item(item_id: int)' with a get decorator at '/items/{item_id}'."
  },

  "query-params": {
    slug: "query-params",
    title: "Query Parameters",
    module: "2. Parameters & Validation",
    initialCode: `from fastapi import FastAPI

app = FastAPI()

fake_items_db = [{"item_name": "Portal Gun"}, {"item_name": "Screwdriver"}, {"item_name": "Plumbus"}]

# Create a GET route /items/ that accepts optional query parameters 'skip' (int, default 0) and 'limit' (int, default 10)
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    return fake_items_db[skip : skip + limit]
`,
    tasks: [
      "Create a GET route looking at path '/items/'.",
      "The function must support options 'skip' (defaulting to 0, type 'int') and 'limit' (defaulting to 10, type 'int').",
      "The endpoint should slice the database list 'fake_items_db' from 'skip' up to 'skip + limit' and return it."
    ],
    testScript: `
def validate(main):
    assert hasattr(main, 'app'), "Could not find 'app' instance of FastAPI."
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    # Test query defaults
    res1 = client.get('/items/')
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    assert len(res1.json()) == 3, f"Expected 3 records inside fake items db list, got {len(res1.json())}."
    
    # Test pagination parameters
    res2 = client.get('/items/?skip=1&limit=1')
    assert res2.status_code == 200, "Expected status code 200 for custom query values."
    items = res2.json()
    assert len(items) == 1, f"Expected limit of 1 to return 1 item, but got {len(items)}"
    assert items[0] == {"item_name": "Screwdriver"}, f"Expected Item 'Screwdriver', got {items[0]}"
    
    return {"passed": True, "message": "Marvelous! Query parameters are working, doing full pagination slicing directly in WASM!"}
`,
    hint: "Define 'read_items(skip: int = 0, limit: int = 10)' inside the endpoint, then perform a python slice on 'fake_items_db[skip : skip + limit]'."
  },

  "request-body": {
    slug: "request-body",
    title: "Request Body",
    module: "2. Parameters & Validation",
    initialCode: `from fastapi import FastAPI
from pydantic import BaseModel

# Create a Pydantic Model named Item
# Fields:
# name (str)
# description (str, optional, default None)
# price (float)
# tax (float, optional, default None)
class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

app = FastAPI()

# Write a POST endpoint at "/items/" accepting an Item
@app.get("/")
def home():
    return {"info": "POST /items/ is where to test!"}

@app.get("/items/") # Just a helper GET route
def list_items():
    return []
`,
    tasks: [
      "Import 'BaseModel' from 'pydantic'.",
      "Configure a class 'Item' inheriting from 'BaseModel'.",
      "Add fields 'name: str', optional string 'description' (default None), 'price: float', and optional float 'tax' (default None).",
      "Configure a POST handler at '/items/' that receives 'item: Item' as a request body and returns the item as-is."
    ],
    testScript: `
def validate(main):
    assert hasattr(main, 'Item'), "Could not locate Pydantic schema class 'Item'."
    from pydantic import BaseModel
    assert issubclass(main.Item, BaseModel), "Class 'Item' must be derived from 'pydantic.BaseModel'"
    
    assert hasattr(main, 'app'), "Could not locate 'app' FastAPI instance."
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    # Test POST endpoint with valid item
    payload = {"name": "Meeseeks Box", "price": 1000.0, "description": "Solves problems"}
    res = client.post('/items/', json=payload)
    
    assert res.status_code == 200, f"Expected POST to /items/ to return 200, got {res.status_code}."
    data = res.json()
    assert data.get('name') == "Meeseeks Box", "Expected response to mirror 'Meeseeks Box' name."
    assert data.get('price') == 1000.0, "Expected response to mirror price."
    
    # Test schema validations
    bad_payload = {"description": "No name given!"}
    res_bad = client.post('/items/', json=bad_payload)
    assert res_bad.status_code == 422, f"Expected 422 error on POSTing incomplete object, got {res_bad.status_code}."
    
    return {"passed": True, "message": "Sensational! Pydantic models automatically validate incoming requests and build your documentation!"}
`,
    hint: "Declare a POST endpoint: '@app.post(\"/items/\")' and inside your function write: 'async def create_item(item: Item): return item'."
  },

  "query-params-str-validation": {
    slug: "query-params-str-validation",
    title: "String Validations",
    module: "3. Advanced Validation",
    initialCode: `from fastapi import FastAPI, Query

# Let's import Query from fastapi for additional metadata & validation

app = FastAPI()

# Add a GET route at "/items/"
# Take query param "q" (str | None, default None, maximum length 50)
# Return {"q": q, "length": len(q)} if q is given, else {"q": None}
@app.get("/items/")
async def read_items(q: str | None = Query(default=None, max_length=50)):
    if q:
        return {"q": q, "length": len(q)}
    return {"q": None}
`,
    tasks: [
      "Declare a GET endpoint at paths '/items/'.",
      "Add parameter 'q' with default Query validation of 'max_length=50'.",
      "Let the default for 'q' be None.",
      "If 'q' is indeed passed, return a dict containing 'q' and its string length 'length'. Otherwise return {'q': None}."
    ],
    testScript: `
def validate(main):
    assert hasattr(main, 'app'), "Could not locate 'app' FastAPI instance."
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    # Test default empty q
    res_empty = client.get('/items/')
    assert res_empty.status_code == 200
    assert res_empty.json() == {"q": None}, f"Expected query default to return None, got {res_empty.json()}"
    
    # Test valid q
    res_val = client.get('/items/?q=fastapi')
    assert res_val.status_code == 200
    assert res_val.json() == {"q": "fastapi", "length": 7}, f"Expected dict containing length of query string, got {res_val.json()}"
    
    # Test validation maximum length bounds
    too_long = "f" * 51
    res_bad = client.get(f'/items/?q={too_long}')
    assert res_bad.status_code == 422, f"Expected HTTP 422 Validation Error for query surpassing 50 letters, got {res_bad.status_code}"
    
    return {"passed": True, "message": "Brilliant! You added custom metadata query field validations using 'Query'!"}
`,
    hint: "Use `q: str | None = Query(default=None, max_length=50)` inside your route function parameters. Don't forget to import Query: `from fastapi import Query`."
  }
};
