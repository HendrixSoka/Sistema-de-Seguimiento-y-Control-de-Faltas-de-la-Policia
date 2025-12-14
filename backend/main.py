from fastapi import FastAPI, Depends, HTTPException,Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import List
from database import  get_db
from datetime import datetime
from schemas import (
    PoliciaCreate, PoliciaRead,
    DelitoCreate, DelitoConPolicia, DelitoRead,
    FaltaLeveCreate, FaltaLeveConPolicia, FaltaLeveRead,
    FaltaGraveCreate, FaltaGraveRead,FaltaGraveConPolicia,
    EtapaCreate, EtapaRead,EtapaUpdate,EtapaEstadistica,
    UsuarioCreate, UsuarioRead,UsuarioUpdate,LoginData,
    LogCreate, LogRead
)
from crud import (
    crear_delito,actualizar_delito,obtener_delitos,
    crear_etapa,modificar_etapa,eliminar_etapa,extender_etapa,
    crear_falta_grave,obtener_faltas_graves,actualizar_falta_grave,
    crear_falta_leve,actualizar_falta_leve,obtener_faltas_leves,obtener_conteo_por_ultima_etapa,
    crear_policia,actualizar_policia,obtener_policias,
    crear_usuario,autenticar_usuario,actualizar_usuario,eliminar_usuario,obtener_usuarios,
    verify_role,
    obtener_logs,
    reporte_conteo_por_policia,
    reporte_porcentaje_sanciones_falta_leve,
    reporte_ranking_delitos_por_tipo_penal
)
# ========================
# CONFIGURACIÓN FASTAPI
# ========================

app = FastAPI(title="API Policial", version="0.0")
origins = [
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"msg": "API Policial"}

@app.get("/policias/", response_model=List[PoliciaRead])
def list_policias(
    nombre: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return obtener_policias(db, nombre=nombre, limit=limit)

@app.post("/policias/",response_model= PoliciaRead, dependencies=[Depends(verify_role("Editor"))])
def create_policia(policia: PoliciaCreate, db: Session = Depends(get_db)):
    return crear_policia(db, policia)

@app.put("/policias/{id_policia}", response_model=PoliciaRead, dependencies=[Depends(verify_role("Editor"))])
def update_policia(id_policia: int, policia: PoliciaCreate, db: Session = Depends(get_db)):
    actualizado = actualizar_policia(db, id_policia, policia)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Policia not found")
    return actualizado

@app.get("/delitos/", response_model=list[DelitoConPolicia])
def listar_delitos(
    nombre_policia: str | None = None,
    unidad_policial: str | None = None,
    tipo_penal: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    return obtener_delitos(
        db,
        nombre_policia,
        unidad_policial,
        tipo_penal,
        page,
        page_size
    )


@app.post("/delitos/", response_model=DelitoRead, dependencies=[Depends(verify_role("Editor"))])
def create_delito(delito: DelitoCreate, db: Session = Depends(get_db)):
    return crear_delito(db, delito)


@app.put("/delitos/{id_delito}", response_model=DelitoRead, dependencies=[Depends(verify_role("Editor"))])
def update_delito(id_delito: int, delito: DelitoCreate, db: Session = Depends(get_db)):
    actualizado = actualizar_delito(db, id_delito, delito)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Delito not found")
    return actualizado


@app.get("/faltas_leves/", response_model=list[FaltaLeveConPolicia])
def listar_faltas_leves(
    unidad_policial: str | None = None,
    nombre_policia: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    return obtener_faltas_leves(
        db,
        unidad_policial=unidad_policial,
        nombre_policia=nombre_policia,
        page=page,
        page_size=page_size
    )


@app.post("/faltas_leves/", response_model=FaltaLeveRead, dependencies=[Depends(verify_role("Editor"))])
def create_falta_leve(falta: FaltaLeveCreate, db: Session = Depends(get_db)):
    return crear_falta_leve(db, falta)

@app.put("/faltas_leves/{id_falta_leve}", response_model=FaltaLeveRead,dependencies=[Depends(verify_role("Editor"))])
def update_falta_leve(id_falta_leve: int, falta_leve: FaltaLeveCreate, db: Session = Depends(get_db)):
    actualizado = actualizar_falta_leve(db, id_falta_leve, falta_leve)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Delito not found")
    return actualizado

@app.get("/faltas_graves/", response_model=list[FaltaGraveConPolicia])
def listar_faltas_graves(
    nombre_policia: str | None = None,
    unidad_policial: str | None = None,
    tipificacion: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    return obtener_faltas_graves(
        db,
        nombre_policia=nombre_policia,
        unidad_policial=unidad_policial,
        tipificacion=tipificacion,
        page=page,
        page_size=page_size
    )


@app.post("/faltas_graves/", response_model=FaltaGraveRead,dependencies=[Depends(verify_role("Editor"))])
def create_falta_grave(falta: FaltaGraveCreate, db: Session = Depends(get_db)):
    return crear_falta_grave(db, falta)

@app.put("/faltas_graves/{id_falta_grave}", response_model=FaltaGraveRead,dependencies=[Depends(verify_role("Editor"))])
def update_falta_grave(id_falta_grave: int, falta_grave: FaltaGraveCreate, db: Session = Depends(get_db)):
    actualizado = actualizar_falta_grave(db, id_falta_grave, falta_grave)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Delito not found")
    return actualizado


@app.post("/etapas/", response_model=EtapaRead,dependencies=[Depends(verify_role("Editor"))])
def crear_etapa_endpoint(
    etapa: EtapaCreate,
    db: Session = Depends(get_db),
):
    return crear_etapa(db, etapa)


@app.put("/etapas/{id_etapa}", response_model=EtapaRead, dependencies=[Depends(verify_role("Editor"))])
def modificar_etapa_endpoint(
    id_etapa: int,
    data: EtapaUpdate,
    db: Session = Depends(get_db)
):
    return modificar_etapa(db, id_etapa, data)


@app.delete("/etapas/{id_etapa}",dependencies=[Depends(verify_role("Editor"))])
def eliminar_etapa_endpoint(
    id_etapa: int,
    db: Session = Depends(get_db),
    id_usuario: int = Query(...),
):
    return eliminar_etapa(db, id_etapa, id_usuario)


@app.patch("/etapas/{id_etapa}/extender", response_model=EtapaRead, dependencies=[Depends(verify_role("Editor"))])
def extender_etapa_endpoint(
    id_etapa: int,
    id_usuario: int = Query(...),
    db: Session = Depends(get_db),
):
    return extender_etapa(db, id_etapa,id_usuario)

@app.get("/usuarios/", response_model=List[UsuarioRead], dependencies=[Depends(verify_role("Supervisor"))])
def list_usuarios(db: Session = Depends(get_db)):
    return obtener_usuarios(db)

@app.post("/usuarios/", response_model=UsuarioRead)
def create_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    return crear_usuario(db, usuario) 


@app.post("/login/")
def login(data: LoginData, db: Session = Depends(get_db)):
    return autenticar_usuario(db, data.username, data.secret_name)

@app.put("/usuarios/{usuario_id}")
def update_usuario(usuario_id: int, datos: UsuarioUpdate, db: Session = Depends(get_db), dependencies=[Depends(verify_role("Supervisor"))]):
    usuario = actualizar_usuario(db, usuario_id, datos)
    if not usuario:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "message": "User updated successfully",
        "user": {
            "id": usuario.id_usuario,
            "name": usuario.nombre,
            "role": usuario.rol
        }
    }


@app.delete("/usuarios/{usuario_id}", response_model=UsuarioRead, dependencies=[Depends(verify_role("Supervisor"))] )
def delete_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = eliminar_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="User not found")
    return usuario

@app.get("/logs", response_model=list[LogRead])
def obtener_logs_endpoint(
    page: int = 1,
    limit: int = 30,
    id_usuario: int | None = None,
    tabla: str | None = None,
    accion: str | None = None,
    db: Session = Depends(get_db),
):
    logs, total = obtener_logs(
        db=db,
        page=page,
        limit=limit,
        id_usuario=id_usuario,
        tabla=tabla,
        accion=accion
    )

    return logs

#reportes 
@app.get("/conteo-por-policia")
def obtener_conteo_por_policia(
    nombre: str = "",       
    page: int = 1,        
    size: int = 10,
    fecha_inicio: datetime = None,
    fecha_fin: datetime = None, 
    db: Session = Depends(get_db)
):
    data = reporte_conteo_por_policia(db, nombre, page, size,fecha_inicio, fecha_fin)
    return {
        "status": True,
        "page": page,
        "size": size,
        "total": data["total"],
        "items": data["items"],
    }


@app.get("/porcentaje-sanciones-faltaleve")
def obtener_porcentaje_sanciones_faltaleve(db: Session = Depends(get_db)):
    data = reporte_porcentaje_sanciones_falta_leve(db)
    return {"status": True, "data": data}
@app.get("/ranking-delitos")
def obtener_ranking_delitos(db: Session = Depends(get_db)):
    data = reporte_ranking_delitos_por_tipo_penal(db)
    return {"status": True, "data": data}

@app.get("/etapa_contar/", response_model=List[EtapaEstadistica])
def etapa_contar(db: Session = Depends(get_db)):
    return obtener_conteo_por_ultima_etapa(db)