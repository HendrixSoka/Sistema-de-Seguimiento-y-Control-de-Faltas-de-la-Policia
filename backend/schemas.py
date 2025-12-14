from datetime import date, datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel


# ============================
#        POLICIA
# ============================

class PoliciaBase(BaseModel):
    nombre: str
    grado: Optional[str] = None
    unidad_policial: Optional[str] = None
    estado: Optional[str] = None

class PoliciaCreate(PoliciaBase):
    pass


class PoliciaRead(PoliciaBase):
    id_policia: int

    class Config:
        from_attributes = True


# ============================
#        DELITO
# ============================

class DelitoBase(BaseModel):
    fecha_inicio: Optional[date] = None
    codigo_unico: Optional[str] = None
    tipo_penal: Optional[str] = None
    con_detencion_preventiva :Optional[str]= None 
    con_detencion_domiciliaria :Optional[str]= None
    con_sentencia_condenatoria_primera_instancia :Optional[str] = None
    con_sentencia_ejecutoriada:Optional[str] = None
    observaciones: Optional[str] = None
    id_policia: Optional[int] = None


class DelitoCreate(DelitoBase):
    id_usuario: int
    pass


class DelitoRead(DelitoBase):
    id_delito: int

    class Config:
        from_attributes = True

# ============================
#       FALTA LEVE
# ============================
from enum import Enum

class TipoSancion(Enum):
    ART_9_LLAMADA_DE_ATENCION_VERBAL = "ART. 9 LLAMADA DE ATENCION VERBAL"
    ART_10_LLAMADA_DE_ATENCION_ESCRITA = "ART. 10 LLAMADA DE ATENCION ESCRITA"
    ART_10_ARRESTO_DE_1_A_3_DIAS = "ART. 10 ARRESTO DE 1 A 3 DIAS"
    ART_11_LLAMADA_DE_ATENCION_ESCRITA = "ART. 11 LLAMADA DE ATENCION ESCRITA"
    ART_11_ARRESTO_DE_4_A_10_DIAS = "ART. 11 ARRESTO DE 4 A 10 DIAS"
    REPRESENTACIONES = "REPRESENTACIONES"

class FaltaLeveBase(BaseModel):
    hoja_tramite_nro: Optional[str] = None
    hoja_tramite_fecha: Optional[date] = None
    memorandum_nro: Optional[str] = None
    memorandum_fecha: Optional[date] = None
    tipo_de_sancion: Optional[TipoSancion] = None
    descripcion_sancion: Optional[str] = None
    nro_oficio_archivo: Optional[str] = None
    observaciones: Optional[str] = None
    id_policia: Optional[int] = None


class FaltaLeveCreate(FaltaLeveBase):
    id_usuario: int
    pass


class FaltaLeveRead(FaltaLeveBase):
    id_falta_leve: int

    class Config:
        from_attributes = True


# ============================
#       FALTA GRAVE
# ============================

class FaltaGraveBase(BaseModel):
    nro_caso: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    tipificacion: Optional[str] = None
    investigador_asignado: Optional[str] = None
    fiscal_asignado: Optional[str] = None
    defensa_asignado: Optional[str] = None
    observaciones: Optional[str] = None
    id_policia: Optional[int] = None


class FaltaGraveCreate(FaltaGraveBase):
    id_usuario: int
    pass


class FaltaGraveRead(FaltaGraveBase):
    id_falta_grave: int

    class Config:
        from_attributes = True


# ============================
#          ETAPA
# ============================

class EtapaBase(BaseModel):
    id_falta_grave: Optional[int] = None
    nombre_etapa: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[date] = None


class EtapaCreate(EtapaBase):
    id_usuario: int
    
class EtapaUpdate(BaseModel):
    fecha_inicio: Optional[date] = None
    descripcion: Optional[str] = None
    id_usuario: int

class EtapaRead(EtapaBase):
    id_etapa: int
    fecha_vencimiento: Optional[date] = None
    class Config:
        from_attributes = True

class EtapaEstadistica(BaseModel):
    nombre_etapa: str
    cantidad: int

# ============================
#         USUARIO
# ============================

class UsuarioBase(BaseModel):
    nombre: str
    cargo: str
    rol: str


class UsuarioCreate(UsuarioBase):
    secret_name: str

class LoginData(BaseModel):
    username: str
    secret_name: str

class UsuarioRead(UsuarioBase):
    id_usuario: int
    estado: int
    user_name: str
    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    secret_name: Optional[str] = None

# ============================
#           LOG
# ============================

class LogBase(BaseModel):
    id_usuario: Optional[int] = None
    tabla_afectada: Optional[str] = None
    id_registro: Optional[int] = None
    accion: Optional[str] = None
    fecha: Optional[datetime] = None
    cambios: Optional[str] = None


class LogCreate(LogBase):
    pass


class LogRead(LogBase):
    id_log: int

    class Config:
        from_attributes = True

# ============================
#         JOINED
# ============================

class DelitoConPolicia(DelitoRead):
    id_delito: int
    id_policia: int
    nombre: str
    grado: Optional[str] = None
    unidad_policial: Optional[str] = None
    estado: Optional[str] = None
    fecha_inicio: Optional[date] = None
    codigo_unico: Optional[str] = None
    tipo_penal: Optional[str] = None
    con_detencion_preventiva :Optional[str]= None 
    con_detencion_domiciliaria :Optional[str]= None
    con_sentencia_condenatoria_primera_instancia :Optional[str] = None
    con_sentencia_ejecutoriada:Optional[str] = None
    observaciones: Optional[str] = None
    class Config:
        from_attributes = True

class FaltaLeveConPolicia(FaltaLeveRead):
    id_falta_leve: int
    id_policia: int
    nombre: str
    grado: Optional[str] = None
    hoja_tramite_nro: Optional[str] = None
    hoja_tramite_fecha: Optional[date] = None
    memorandum_nro: Optional[str] = None
    memorandum_fecha: Optional[date] = None
    tipo_de_sancion: Optional[TipoSancion] = None
    descripcion_sancion: Optional[str] = None
    nro_oficio_archivo: Optional[str] = None
    observaciones: Optional[str] = None
    class Config:
        from_attributes = True

class FaltaGraveConPolicia(FaltaGraveRead):
    id_falta_grave: int
    id_policia: int
    nombre: str
    grado: Optional[str] = None
    unidad_policial: Optional[str] = None
    nro_caso: Optional[str] = None
    tipificacion: Optional[str] = None
    investigador_asignado: Optional[str] = None
    fiscal_asignado: Optional[str] = None
    defensa_asignado: Optional[str] = None
    observaciones: Optional[str] = None
    etapas: Optional[List[EtapaRead]] = None
    class Config:
        from_attributes = True

class ReportePolicia(BaseModel):
    id_policia: int
    nombre: str
    grado: Optional[str] = None
    unidad_policial: Optional[str] = None
    estado: Optional[str] = None
    total_delitos: int = 0
    total_faltas_leves: int = 0
    total_faltas_graves: int = 0