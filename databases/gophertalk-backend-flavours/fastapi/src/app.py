import os

from dotenv import load_dotenv
from fastapi import FastAPI, Response, status
from controllers.auth_controller import router as auth_router
from controllers.user_controller import router as user_router      

load_dotenv()

from config.db import pool

app = FastAPI()
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")               

port = int(os.getenv("PORT", 3000))


@app.get("/api/health-check")
def health_check():
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return Response(content="OK", status_code=status.HTTP_200_OK)
    except Exception:
        return Response(content="DB connection failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)