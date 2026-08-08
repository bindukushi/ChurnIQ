from fastapi import APIRouter, Depends

from app.database.models import User
from app.auth.security import require_roles
from app.ml.train import train_and_compare
from app.ml.predict import load_model, load_leaderboard, _background_data

router = APIRouter(prefix="/api/train", tags=["Model Training"])


@router.post("")
def train(current_user: User = Depends(require_roles("admin", "analyst"))):
    result = train_and_compare()
    # bust cached model/leaderboard so the API picks up the freshly trained one
    load_model.cache_clear()
    load_leaderboard.cache_clear()
    _background_data.cache_clear()
    return result


@router.get("/leaderboard")
def leaderboard(current_user: User = Depends(require_roles("admin", "analyst", "manager"))):
    return load_leaderboard()
