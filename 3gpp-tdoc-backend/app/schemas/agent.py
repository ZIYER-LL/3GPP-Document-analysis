from pydantic import BaseModel


class AgentExecuteRequest(BaseModel):
    message: str