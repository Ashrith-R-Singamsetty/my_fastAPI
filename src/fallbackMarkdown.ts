/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const FALLBACK_MARKDOWN: Record<string, string> = {
  "first-steps": `# First Steps

The simplest FastAPI file might look like this:

\`\`\`python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello World"}
\`\`\`

Let's copy that to a file \`main.py\`.

### Run it

To run the live server locally in your own machine, you would run a tool called Uvicorn:

\`\`\`bash
$ uvicorn main:app --reload

INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [28720] using StatReload
INFO:     Started server process [28722]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
\`\`\`

Here, Uvicorn looks for an instance of FastAPI named \`app\` inside \`main.py\`.

But in this sandbox, **Pyodide delivers a real-time server directly in your browser!** No installation of Python or Node is required.

---

### Step-by-Step Breakdown

#### Step 1: Import \`FastAPI\`

\`\`\`python
from fastapi import FastAPI
\`\`\`

\`FastAPI\` is a Python class that provides all the functionality for your API.

#### Step 2: Create an \`app\` instance

\`\`\`python
app = FastAPI()
\`\`\`

Here the \`app\` variable will be an "instance" of the class \`FastAPI\`. This will be the main point of interaction to create all your API.

#### Step 3: Create a path operation

##### Path
"Path" here refers to the last part of the URL starting from the first \`/\`.
So, in a URL like: \`https://example.com/items/foo\`, the path is \`/items/foo\`.

A "path" is commonly called an **endpoint** or a **route**.

##### Operation
"Operation" here refers to one of the HTTP "methods".
One of:
* \`POST\`
* \`GET\`
* \`PUT\`
* \`DELETE\`

In our code, we use \`@app.get("/")\` which tells FastAPI that the function below is in charge of handling requests that go to:
* the path \`/\`
* using a \`get\` operation

#### Step 4: Define the path operation function

\`\`\`python
def read_root():
    return {"message": "Hello World"}
\`\`\`

This is our function: it is called by **FastAPI** whenever it receives a request to the URL \`/\` using a \`GET\` operation.
In this case, it returns a Python \`dict\`. FastAPI automatically converts it into JSON format.
`,

  "path-params": `# Path Parameters

You can declare path "parameters" or "variables" with the same syntax used by Python format strings:

\`\`\`python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/{item_id}")
async def read_item(item_id):
    return {"item_id": item_id}
\`\`\`

The value of the path parameter \`item_id\` will be passed to your function as the argument \`item_id\`.

So, if you run this example and go to \`http://127.0.0.1:8000/items/foo\`, you will see a response of:

\`\`\`json
{"item_id": "foo"}
\`\`\`

---

### Path Parameters with Types

You can declare the type of a path parameter in the function, using standard Python type hints:

\`\`\`python
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
\`\`\`

By declaring \`item_id: int\`, FastAPI gives you automatic type validation and parsing.

#### Data Conversion
If you go to \`http://127.0.0.1:8000/items/3\`, the response will be:
\`\`\`json
{"item_id": 3}
\`\`\`
Notice that the value is \`3\` (an integer), not \`"3"\` (a string). FastAPI converted and validated it.

#### Data Validation
If you open your mock browser and request \`/items/foo\` (not an integer), you will see an HTTP error:

\`\`\`json
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "item_id"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "foo"
    }
  ]
}
\`\`\`

The error is clean, structured, and generated on your behalf!
`,

  "query-params": `# Query Parameters

When you declare function parameters that are not part of the path parameters, they are automatically interpreted as "query" parameters.

\`\`\`python
from fastapi import FastAPI

app = FastAPI()

fake_items_db = [{"item_name": "Foo"}, {"item_name": "Bar"}, {"item_name": "Baz"}]


@app.get("/items/")
async def read_item(skip: int = 0, limit: int = 10):
    return fake_items_db[skip : skip + limit]
\`\`\`

The query is the set of key-value pairs that go after the \`?\` in a URL, separated by \`&\` characters.

For example, in the URL:
\`\`\`
http://127.0.0.1:8000/items/?skip=0&limit=2
\`\`\`
...the query parameters are:
* \`skip\`: with a value of \`0\`
* \`limit\`: with a value of \`2\`

As they are part of the URL, they are "naturally" strings. But when you declare them with Python types, they are converted and validated against those types.

### Default Values

Because query parameters are not fixed parts of the path, they can be optional and have default values.

In the example above, they have default values of \`skip = 0\` and \`limit = 10\`.
So, going to:
\`\`\`
http://127.0.0.1:8000/items/
\`\`\`
is the same as going to:
\`\`\`
http://127.0.0.1:8000/items/?skip=0&limit=10
\`\`\`
`,

  "request-body": `# Request Body

When you need to send data from a client (e.g. a web browser) to your API, you send it as a **request body**.

To declare a request body, you use **Pydantic** models with all their power and benefits.

### Step 1: Import Pydantic's \`BaseModel\`

First, you need to import \`BaseModel\` from \`pydantic\`:

\`\`\`python
from fastapi import FastAPI
from pydantic import BaseModel
\`\`\`

### Step 2: Create your Data Model

Then you declare your data model as a class that inherits from \`BaseModel\`.

\`\`\`python
class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None
\`\`\`

When a model attribute has a default value (like \`description\` or \`tax\`), it is optional. Otherwise, it is required.

### Step 3: Use it in your Path Operation

To add it to your path operation, declare it the same way you declared path/query parameters, but using the \`Item\` class as the type hint:

\`\`\`python
@app.post("/items/")
async def create_item(item: Item):
    return item
\`\`\`

FastAPI will automatically:
1. Read the body of the request as JSON.
2. Convert and validate the types (generating clean validation errors if structures are incorrect).
3. Provide full autogenerated Swagger documentation for the schema!
`,

  "query-params-str-validation": `# Query Parameters and String Validations

FastAPI allows you to declare additional information and validation for your parameters using the \`Query\` helper.

\`\`\`python
from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/items/")
async def read_items(q: str | None = Query(default=None, max_length=50)):
    results = {"items": [{"item_id": "Foo"}, {"item_id": "Bar"}]}
    if q:
        results.update({"q": q})
    return results
\`\`\`

The query parameter \`q\` is of type \`str | None\` (meaning it's a string, but can be \`None\`), and by default it is \`None\`.

We pass \`Query(default=None, max_length=50)\` to define constraints:
* \`max_length=50\`: ensures the string does not surpass 50 characters.

If the user attempts to send a query string larger than 50 characters, FastAPI will automatically reject the query with a clean \`422 Validation Error\`.
`
};
