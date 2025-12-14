# app/crud.py
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer,HTTPBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session,joinedload,aliased
from sqlalchemy import func, text, and_
from config import settings
import json
from datetime import datetime, timedelta,timezone
from models import Policia, Delito, FaltaLeve, FaltaGrave, Etapa, Usuario, Log
from schemas import (
    PoliciaCreate, PoliciaRead,
    DelitoCreate, DelitoRead,
    FaltaLeveCreate, FaltaLeveRead,
    FaltaGraveCreate, FaltaGraveRead,
    EtapaCreate, EtapaRead,
    UsuarioCreate, UsuarioRead,
    LogCreate, LogRead,
    FaltaLeveConPolicia,
    DelitoConPolicia,
    FaltaGraveConPolicia,
    ReportePolicia,
)
from datetime import date, datetime
from typing import Optional
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

security = HTTPBearer()
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

def obtener_policias(db: Session, nombre: str = None, limit: int = 50):
    query = db.query(Policia)
    if nombre:
        query = query.filter(Policia.nombre.ilike(f"{nombre}%"))
    return query.limit(limit).all()

def crear_policia(db: Session, policia: PoliciaCreate):
    nuevo = Policia(**policia.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def actualizar_policia(db: Session, id_policia: int, datos: PoliciaCreate):
    policia = db.query(Policia).filter(Policia.id_policia == id_policia).first()
    if not policia:
        return None
    for key, value in datos.dict(exclude_unset=True).items():
        setattr(policia, key, value)
    db.commit()
    db.refresh(policia)
    return policia

def obtener_delitos(
    db: Session,
    nombre_policia: str | None = None,
    unidad_policial: str | None = None,
    tipo_penal: str | None = None,
    page: int = 1,
    page_size: int = 20
):
    query = db.query(Delito).options(joinedload(Delito.policia))

    if nombre_policia:
        query = query.join(Delito.policia).filter(
            Policia.nombre.ilike(f"%{nombre_policia}%")
        )

    if unidad_policial:
        query = query.join(Delito.policia).filter(
            Policia.unidad_policial.ilike(f"%{unidad_policial}%")
        )

    if tipo_penal:
        query = query.filter(
            Delito.tipo_penal.ilike(f"%{tipo_penal}%")
        )
    query = query.order_by(Delito.id_delito.desc())
    offset = (page - 1) * page_size
    delitos = query.offset(offset).limit(page_size).all()
    resultado = [
        DelitoConPolicia(
            id_delito=d.id_delito,
            id_policia=d.policia.id_policia,
            nombre=d.policia.nombre,
            grado=d.policia.grado,
            estado=d.policia.estado,
            unidad_policial=d.policia.unidad_policial,
            fecha_inicio=d.fecha_inicio,
            codigo_unico=d.codigo_unico,
            tipo_penal=d.tipo_penal,
            con_detencion_preventiva=d.con_detencion_preventiva,
            con_detencion_domiciliaria=d.con_detencion_domiciliaria,
            con_sentencia_condenatoria_primera_instancia=d.con_sentencia_condenatoria_primera_instancia,
            con_sentencia_ejecutoriada=d.con_sentencia_ejecutoriada,
            observaciones=d.observaciones
        )
        for d in delitos
    ]

    return resultado

def crear_delito(db: Session, delito: DelitoCreate):
    existe = db.query(Delito).filter(Delito.codigo_unico == delito.codigo_unico).first()
    if existe:
        raise HTTPException(status_code=400, detail="El código ya existe")
    nuevo = Delito(**delito.dict(exclude={"id_usuario"}))
    db.add(nuevo)
    db.flush()
    crear_log(db, LogCreate(
        tabla_afectada="Delitos",
        id_registro=nuevo.id_delito,
        accion="crear",
        id_usuario=delito.id_usuario
    ))
    db.commit()
    db.refresh(nuevo)
    return nuevo

from datetime import datetime, timezone
import json

def actualizar_delito(db: Session, id_delito: int, datos: DelitoCreate):
    delito = db.query(Delito).filter(Delito.id_delito == id_delito).first()
    if not delito:
        return None
    estado_anterior = delito.__dict__.copy()
    for key, value in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        setattr(delito, key, value)
    cambios = {}
    for key, nuevo_valor in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        valor_anterior = estado_anterior.get(key)
        if valor_anterior != nuevo_valor:
            cambios[key] = [valor_anterior, nuevo_valor]
    if cambios:
        log = crear_log(db, LogCreate(
            id_usuario=datos.id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="modificar",
            tabla_afectada="Delitos",
            id_registro=id_delito,
            cambios=json.dumps(cambios, ensure_ascii=False)
        ))

    db.commit()
    db.refresh(delito)
    return delito


def obtener_faltas_leves(
    db: Session,
    unidad_policial: str | None = None,
    nombre_policia: str | None = None,
    page: int = 1,
    page_size: int = 20
):
    query = (
        db.query(FaltaLeve)
        .join(Policia, FaltaLeve.id_policia == Policia.id_policia)
        .options(joinedload(FaltaLeve.policia))
    )

    if unidad_policial:
        query = query.filter(Policia.unidad_policial.ilike(f"%{unidad_policial}%"))

    if nombre_policia:
        query = query.filter(Policia.nombre.ilike(f"%{nombre_policia}%"))
    query = query.order_by(FaltaLeve.id_falta_leve.desc())
    offset = (page - 1) * page_size
    faltas = query.offset(offset).limit(page_size).all()

    resultado = [
        FaltaLeveConPolicia(
            id_falta_leve=f.id_falta_leve,
            id_policia=f.policia.id_policia,
            nombre=f.policia.nombre,
            grado=f.policia.grado,
            hoja_tramite_nro=f.hoja_tramite_nro,
            hoja_tramite_fecha=f.hoja_tramite_fecha,
            memorandum_nro=f.memorandum_nro,
            memorandum_fecha=f.memorandum_fecha,
            tipo_de_sancion=f.tipo_de_sancion,
            descripcion_sancion=f.descripcion_sancion,
            nro_oficio_archivo=f.nro_oficio_archivo,
            observaciones=f.observaciones
        )
        for f in faltas
    ]

    return resultado


def crear_falta_leve(db: Session, falta: FaltaLeveCreate):
    nuevo = FaltaLeve(**falta.dict(exclude={"id_usuario"}))
    db.add(nuevo)
    db.flush()
    crear_log(db, LogCreate(
        tabla_afectada="Faltas_Leves",
        id_registro=nuevo.id_falta_leve,
        accion="crear",
        id_usuario=falta.id_usuario
    ))
    db.commit()
    db.refresh(nuevo)
    return nuevo

def actualizar_falta_leve(db: Session, id_falta_leve: int, datos: FaltaLeveCreate):
    falta = db.query(FaltaLeve).filter(FaltaLeve.id_falta_leve == id_falta_leve).first()
    if not falta:
        return None

    estado_anterior = falta.__dict__.copy()

    for key, value in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        setattr(falta, key, value)

    cambios = {}
    for key, nuevo_valor in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        valor_anterior = estado_anterior.get(key)
        if valor_anterior != nuevo_valor:
            cambios[key] = [valor_anterior, nuevo_valor]

    if cambios:
        log = crear_log(db, LogCreate(
            id_usuario=datos.id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="modificar",
            tabla_afectada="Faltas_Leves",
            id_registro=id_falta_leve,
            cambios=json.dumps(cambios, ensure_ascii=False)
        ))

    db.commit()
    db.refresh(falta)
    return falta

def obtener_faltas_graves(
    db: Session,
    nombre_policia: str | None = None,
    unidad_policial: str | None = None,
    tipificacion: str | None = None,
    page: int = 1,
    page_size: int = 20
):
    query = (
        db.query(FaltaGrave)
        .join(Policia, FaltaGrave.id_policia == Policia.id_policia)
        .options(
            joinedload(FaltaGrave.policia),
            joinedload(FaltaGrave.etapas)
        )
    )

    if nombre_policia:
        query = query.filter(Policia.nombre.ilike(f"%{nombre_policia}%"))

    if unidad_policial:
        query = query.filter(Policia.unidad_policial.ilike(f"%{unidad_policial}%"))

    if tipificacion:
        query = query.filter(FaltaGrave.tipificacion.ilike(f"%{tipificacion}%"))

    query = query.order_by(FaltaGrave.id_falta_grave.desc())

    offset = (page - 1) * page_size
    faltas = query.offset(offset).limit(page_size).all()

    resultado = [
        FaltaGraveConPolicia(
            id_falta_grave=f.id_falta_grave,
            id_policia=f.policia.id_policia,
            nombre=f.policia.nombre,
            grado=f.policia.grado,
            unidad_policial=f.policia.unidad_policial,
            nro_caso=f.nro_caso,
            tipificacion=f.tipificacion,
            investigador_asignado=f.investigador_asignado,
            fiscal_asignado=f.fiscal_asignado,
            defensa_asignado=f.defensa_asignado,
            observaciones=f.observaciones,
            etapas=[
                {
                    "id_etapa": e.id_etapa,
                    "nombre_etapa": e.nombre_etapa,
                    "fecha_inicio": e.fecha_inicio,
                    "fecha_vencimiento": e.fecha_vencimiento,
                    "descripcion": e.descripcion,
                    "id_falta_grave": e.id_falta_grave,
                }
                for e in f.etapas
            ] if f.etapas else []
        )
        for f in faltas
    ]

    return resultado


def crear_falta_grave(db: Session, falta: FaltaGraveCreate):
    existe = db.query(FaltaGrave).filter(FaltaGrave.nro_caso == falta.nro_caso).first()
    if existe:
        raise HTTPException(status_code=400, detail="El código ya existe")
    nuevo = FaltaGrave(**falta.dict(exclude={"id_usuario"}))
    db.add(nuevo)
    db.flush()
    crear_log(db, LogCreate(
        tabla_afectada="Faltas_Graves",
        id_registro=nuevo.id_falta_grave,
        accion="crear",
        id_usuario=falta.id_usuario
    ))
    db.commit()
    db.refresh(nuevo)
    return nuevo

def actualizar_falta_grave(db: Session, id_falta_grave: int, datos: FaltaGraveCreate):
    falta = db.query(FaltaGrave).filter(FaltaGrave.id_falta_grave == id_falta_grave).first()
    if not falta:
        return None
    estado_anterior = falta.__dict__.copy()

    for key, value in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        setattr(falta, key, value)

    cambios = {}
    for key, nuevo_valor in datos.dict(exclude_unset=True, exclude={"id_usuario"}).items():
        valor_anterior = estado_anterior.get(key)
        if valor_anterior != nuevo_valor:
            cambios[key] = [valor_anterior, nuevo_valor]
    if cambios:
        log = crear_log(db, LogCreate(
            id_usuario=datos.id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="modificar",
            tabla_afectada="Faltas_Graves",
            id_registro=id_falta_grave,
            cambios=json.dumps(cambios, ensure_ascii=False)
        ))

    db.commit()
    db.refresh(falta)
    return falta

def obtener_conteo_por_ultima_etapa(db):
    # Alias de Etapa
    EE = aliased(Etapa)

    # Subquery: última etapa por id_falta_grave
    subquery_max = (
        db.query(
            EE.id_falta_grave,
            func.max(EE.id_etapa).label("ultima_etapa_id")
        )
        .group_by(EE.id_falta_grave)
        .subquery()
    )

    # Subquery que obtiene la etapa completa (igual que tu e.*)
    subquery_etapa = (
        db.query(Etapa)
        .join(subquery_max, subquery_max.c.ultima_etapa_id == Etapa.id_etapa)
        .subquery()
    )

    # Consulta principal
    query = (
        db.query(
            subquery_etapa.c.nombre_etapa.label("nombre_etapa"),
            func.count().label("cantidad")
        )
        .filter(
            func.strftime('%Y', subquery_etapa.c.fecha_inicio)
            == func.strftime('%Y', 'now')
        )
        .group_by(subquery_etapa.c.nombre_etapa)
        .all()
    )

    return [
        {"nombre_etapa": nombre, "cantidad": cantidad}
        for nombre, cantidad in query
    ]
def crear_etapa(db: Session, etapa: EtapaCreate):
    try:
        with open("deadlines.json", "r", encoding="utf-8") as f:
            deadlines = json.load(f)
    except FileNotFoundError:
        deadlines = {}

    fecha_vencimiento = None
    if etapa.fecha_inicio and etapa.nombre_etapa:
        if etapa.nombre_etapa in deadlines:
            dias = deadlines[etapa.nombre_etapa][0]

            if dias is not None:
                fecha_vencimiento = etapa.fecha_inicio + timedelta(days=dias)
            else:
                fecha_vencimiento = None
        else:
            dias = None
            fecha_vencimiento = None


    nuevo = Etapa(
        id_falta_grave=etapa.id_falta_grave,
        nombre_etapa=etapa.nombre_etapa,
        descripcion=etapa.descripcion,
        fecha_inicio=etapa.fecha_inicio,
        fecha_vencimiento=fecha_vencimiento,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    cambios = {
        "nombre_etapa": nuevo.nombre_etapa,
        "descripcion": nuevo.descripcion,
        "fecha_inicio": str(nuevo.fecha_inicio),
        "fecha_vencimiento": str(nuevo.fecha_vencimiento),
    }

    crear_log(
        db,
        LogCreate(
            id_usuario=etapa.id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="crear",
            tabla_afectada="Etapa",
            id_registro=nuevo.id_etapa,
            cambios=json.dumps(cambios, ensure_ascii=False),
        ),
    )

    return nuevo

def modificar_etapa(db: Session, id_etapa: int, data):
    etapa = db.query(Etapa).filter(Etapa.id_etapa == id_etapa).first()
    if not etapa:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")

    cambios = {}

    try:
        with open("deadlines.json", "r", encoding="utf-8") as f:
            deadlines = json.load(f)
    except FileNotFoundError:
        deadlines = {}

    if data.descripcion is not None and data.descripcion != etapa.descripcion:
        cambios["descripcion"] = {"antes": etapa.descripcion, "despues": data.descripcion}
        etapa.descripcion = data.descripcion

    fecha_inicio_anterior = etapa.fecha_inicio

    if data.fecha_inicio is not None and data.fecha_inicio != etapa.fecha_inicio:
        cambios["fecha_inicio"] = {"antes": str(etapa.fecha_inicio), "despues": str(data.fecha_inicio)}
        etapa.fecha_inicio = data.fecha_inicio

    if (data.fecha_inicio and data.fecha_inicio != fecha_inicio_anterior):
        etapa.nivel = 0
        dias = deadlines[etapa.nombre_etapa][etapa.nivel]
        if dias is not None and etapa.fecha_inicio:
            nueva_fecha_venc = etapa.fecha_inicio + timedelta(days=dias)
        else:
            nueva_fecha_venc = None

        if nueva_fecha_venc != etapa.fecha_vencimiento:
            cambios["fecha_vencimiento"] = {
                "antes": str(etapa.fecha_vencimiento),
                "despues": str(nueva_fecha_venc),
            }
            etapa.fecha_vencimiento = nueva_fecha_venc

    if not cambios:
        return etapa 

    db.commit()
    db.refresh(etapa)
    crear_log(
        db,
        LogCreate(
            id_usuario=data.id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="modificar",
            tabla_afectada="Etapa",
            id_registro=etapa.id_etapa,
            cambios=json.dumps(cambios, ensure_ascii=False),
        ),
    )

    return etapa

def eliminar_etapa(db: Session, id_etapa: int, id_usuario):
    etapa = db.query(Etapa).filter(Etapa.id_etapa == id_etapa).first()
    if not etapa:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")

    cambios = {
        "id_etapa": etapa.id_etapa,
        "id_falta_grave": etapa.id_falta_grave,
        "nombre_etapa": etapa.nombre_etapa,
        "descripcion": etapa.descripcion,
        "fecha_inicio": str(etapa.fecha_inicio),
        "fecha_vencimiento": str(etapa.fecha_vencimiento),
        "nivel" : etapa.nivel,
    }

    db.delete(etapa)
    db.commit()
    crear_log(
        db,
        LogCreate(
            id_usuario=id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="eliminar",
            tabla_afectada="Etapa",
            id_registro=id_etapa,
            cambios=json.dumps(cambios, ensure_ascii=False),
        ),
    )

    return {"mensaje": "Etapa eliminada correctamente", "id_etapa": id_etapa}

def extender_etapa(db: Session, id_etapa: int,id_usuario):
    etapa = db.query(Etapa).filter(Etapa.id_etapa == id_etapa).first()
    if not etapa:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")

    with open("deadlines.json", "r", encoding="utf-8") as f:
        deadlines = json.load(f)

    duraciones = deadlines[etapa.nombre_etapa]
    if not duraciones:
        raise HTTPException(status_code=400, detail="Etapa sin configuración de duración")

    i = etapa.nivel + 1
    if i >= len(duraciones):
        raise HTTPException(status_code=400, detail="No hay más extensiones disponibles")

    dias_extra = duraciones[i]
    antigua_fecha_vencimiento = etapa.fecha_vencimiento
    etapa.fecha_vencimiento += timedelta(days=dias_extra)
    etapa.indice_duracion = i
    cambios = {}
    cambios["fecha_vencimiento"] = {
                "antes": str(antigua_fecha_vencimiento),
                "despues": str(etapa.fecha_vencimiento),
            }
    crear_log(
        db,
        LogCreate(
            id_usuario=id_usuario,
            fecha=datetime.now(timezone.utc),
            accion="eliminar",
            tabla_afectada="Etapa",
            id_registro=id_etapa,
            cambios=json.dumps(cambios, ensure_ascii=False),
        ),
    )

    db.commit()
    db.refresh(etapa)
    return etapa



def obtener_usuarios(db: Session):
    return db.query(Usuario).filter(Usuario.estado == 1).all() 


def crear_usuario(db: Session, usuario: UsuarioCreate):
    existente_nombre = db.query(Usuario).filter(Usuario.nombre == usuario.nombre).first()
    if existente_nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese nombre"
        )

    usuarios_existentes = db.query(Usuario).all()
    for u in usuarios_existentes:
        if pwd_context.verify(usuario.secret_name, u.secret_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña ya está en uso por otro usuario"
            )

    partes = usuario.nombre.strip().split()
    if len(partes) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre debe incluir al menos un nombre y un apellido"
        )

    if len(partes) >= 3:
        primer_nombre = partes[0].lower()
        primer_apellido = partes[2].lower()
    else:
        primer_nombre = partes[0].lower()
        primer_apellido = partes[1].lower()
    base_username = f"{primer_nombre}.{primer_apellido}"
    username = base_username

    contador = 1
    while db.query(Usuario).filter(Usuario.user_name == username).first():
        username = f"{base_username}{contador}"
        contador += 1

    hashed_secret = pwd_context.hash(usuario.secret_name)

    nuevo = Usuario(
        nombre=usuario.nombre,
        user_name=username,
        cargo=usuario.cargo,
        rol=usuario.rol,
        secret_name=hashed_secret
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def crear_token_de_acceso(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verificar_contraseña(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def autenticar_usuario(db: Session, username: str, secret_name: str):
    usuario = db.query(Usuario).filter(Usuario.user_name == username, Usuario.estado == 1).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    if not verificar_contraseña(secret_name, usuario.secret_name):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
        )
    
    expires = timedelta(days=30)
    token = crear_token_de_acceso(
        data={
            "sub": str(usuario.id_usuario),
            "rol": usuario.rol,
            "cargo": usuario.cargo,
            "nombre": usuario.nombre,
        },
        expires_delta=expires
    )
    
    return {"access_token": token, "token_type": "bearer"}
   
def actualizar_usuario(db: Session, usuario_id: int, datos_actualizados):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if datos_actualizados.nombre is not None:
        existente = db.query(Usuario).filter(
            Usuario.nombre == datos_actualizados.nombre,
            Usuario.id_usuario != usuario_id
        ).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro usuario con ese nombre"
            )
        usuario.nombre = datos_actualizados.nombre

    if datos_actualizados.rol is not None:
        usuario.rol = datos_actualizados.rol
    if datos_actualizados.secret_name is not None:
        usuarios_existentes = db.query(Usuario).filter(Usuario.id_usuario != usuario_id).all()
        for u in usuarios_existentes:
            if pwd_context.verify(datos_actualizados.secret_name, u.secret_name):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña ya está en uso por otro usuario"
                )
        usuario.secret_name = pwd_context.hash(datos_actualizados.secret_name)

    db.commit()
    db.refresh(usuario)
    return usuario


def eliminar_usuario(db: Session, usuario_id: int):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        return None
    
    usuario.estado = 0 
    db.commit()
    db.refresh(usuario)
    return usuario

def crear_log(db: Session, log: LogCreate):
    nuevo = Log(**log.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def obtener_logs(
    db: Session,
    page: int = 1,
    limit: int = 30,
    id_usuario: int | None = None,
    tabla: str | None = None,
    accion: str | None = None,
):
    query = db.query(Log)

    if id_usuario:
        query = query.filter(Log.id_usuario == id_usuario)

    if tabla:
        query = query.filter(Log.tabla_afectada == tabla)

    if accion:
        query = query.filter(Log.accion == accion) 

    query = query.order_by(Log.fecha.desc())

    total = query.count()

    logs = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return logs, total
############################
#Seguridad
###########################

def decode_jwt(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload 
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_jwt(token) 
    user = Usuario(
        id_usuario = payload["sub"],
        rol = payload["rol"],
        cargo = payload.get("cargo"),
        nombre = payload.get("nombre")
    )
    return user

def verify_role(required_role: str):
    def role_checker(user: Usuario = Depends(get_current_user)):
        if user.rol != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: insufficient privileges"
            )
        return True 
    return role_checker


FECHA_MIN = datetime(1900, 1, 1)
FECHA_MAX = datetime(2100, 12, 31)
def reporte_conteo_por_policia(db: Session, nombre: str = "", page: int = 1, size: int = 10,fecha_inicio: Optional[datetime] = None,
fecha_fin: Optional[datetime] = None,):

    if fecha_inicio is None:
        fecha_inicio = FECHA_MIN
    if fecha_fin is None:
        fecha_fin = FECHA_MAX
    query = (
        db.query(
            Policia.id_policia.label("id_policia"),
            Policia.nombre.label("nombre"),
            Policia.grado.label("grado"),
            Policia.unidad_policial.label("unidad_policial"),
            func.count(func.distinct(Delito.id_delito)).label("total_delitos"),
            func.count(func.distinct(FaltaGrave.id_falta_grave)).label("total_faltas_graves"),
            func.count(func.distinct(FaltaLeve.id_falta_leve)).label("total_faltas_leves"),
        )
        .outerjoin(
            Delito,
            and_(
                Delito.id_policia == Policia.id_policia,
                Delito.fecha_inicio.between(fecha_inicio, fecha_fin)
            )
        )
        .outerjoin(
            FaltaGrave,
            and_(
                FaltaGrave.id_policia == Policia.id_policia,
                FaltaGrave.fecha_ingreso.between(fecha_inicio, fecha_fin)
            )
        )
        .outerjoin(
            FaltaLeve,
            and_(
                FaltaLeve.id_policia == Policia.id_policia,
                FaltaLeve.hoja_tramite_fecha.between(fecha_inicio, fecha_fin)
            )
        )
        .group_by(
            Policia.id_policia,
            Policia.nombre,
            Policia.grado,
            Policia.unidad_policial,
        )
    )



    if nombre:
        query = query.filter(Policia.nombre.ilike(f"{nombre}%"))

    total = query.count()

    query = query.order_by(Policia.nombre).offset((page - 1) * size).limit(size)
    resultados = query.all()
    items = [
        ReportePolicia(
            id_policia=r.id_policia,
            nombre=r.nombre,
            grado=r.grado,
            unidad_policial=r.unidad_policial,
            total_delitos=r.total_delitos,
            total_faltas_graves=r.total_faltas_graves,
            total_faltas_leves=r.total_faltas_leves,
        )
        for r in resultados
    ]
    return {
        "total": total,
        "items": items,
        "page": page,
        "size": size,
    }

def reporte_porcentaje_sanciones_falta_leve(db: Session):
    query = text("""
        SELECT 
            tipo_de_sancion,
            COUNT(*) AS cantidad,
            ROUND( COUNT(*) * 100.0 / (SELECT COUNT(*) FROM FaltaLeve), 2 ) AS porcentaje
        FROM FaltaLeve
        WHERE tipo_de_sancion IS NOT NULL
        GROUP BY tipo_de_sancion
        ORDER BY cantidad DESC;
    """)
    
    result = db.execute(query).mappings().all()
    return [dict(row) for row in result]

def reporte_ranking_delitos_por_tipo_penal(db: Session):
    query = text("""
        SELECT 
            tipo_penal,
            COUNT(*) AS total
        FROM Delito
        GROUP BY tipo_penal
        ORDER BY total DESC;
    """)
    
    result = db.execute(query).mappings().all()
    return [dict(row) for row in result]
