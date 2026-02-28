from pydantic_settings import BaseSettings


class Configuracion(BaseSettings):
    """Configuración central de la aplicación BitCorp ERP."""

    # Base de datos
    database_url: str = (
        "postgresql+asyncpg://bitcorp:dev_password_change_me@postgres:5432/bitcorp_dev"
    )
    db_host: str = "postgres"
    db_port: int = 5432
    postgres_db: str = "bitcorp_dev"
    postgres_user: str = "bitcorp"
    postgres_password: str = "dev_password_change_me"
    db_pool_size: int = 20
    db_pool_timeout: int = 30

    # Redis
    redis_url: str = "redis://redis:6379"

    # JWT (debe coincidir con el BFF Node.js)
    jwt_secret: str = "dev_jwt_secret_change_in_production"
    jwt_refresh_secret: str = "dev_refresh_secret_change_in_production"
    jwt_expires_minutes: int = 15
    jwt_refresh_expires_days: int = 7
    jwt_algorithm: str = "HS256"

    # Servidor
    port: int = 3410
    environment: str = "development"
    log_level: str = "debug"

    # CORS
    cors_origins: str = (
        "http://localhost:3420,http://localhost:4200,"
        "http://127.0.0.1:3420,http://127.0.0.1:4200"
    )

    # Email
    smtp_host: str = "smtp.example.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@bitcorp.com"
    email_log_only: bool = True

    # Archivos
    max_file_size: int = 10485760
    upload_path: str = "/tmp/uploads"

    @property
    def origenes_cors(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def es_desarrollo(self) -> bool:
        return self.environment == "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


configuracion = Configuracion()
