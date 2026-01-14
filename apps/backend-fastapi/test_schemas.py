from pydantic import BaseModel

class TestModel(BaseModel):
    name: str

print("TestModel created successfully")