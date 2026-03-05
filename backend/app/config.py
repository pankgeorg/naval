from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://maritime:changeme@localhost:5432/maritime"
    jwt_secret: str = "supersecretdev"
    allow_anonymous: bool = True
    seed_on_startup: bool = True
    eua_default_price: float = 75.0

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
