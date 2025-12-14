from sqlalchemy import (
    Column, Integer, String, Date, Text, ForeignKey,
    Enum, TIMESTAMP
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base 
from schemas import TipoSancion
from sqlalchemy.types import Enum as SqlEnum
from datetime import date
class Policia(Base):
    __tablename__ = 'Policia'

    id_policia = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255))
    grado = Column(String(50))
    unidad_policial = Column(String(100))
    estado = Column(Enum('Descanso', 'Servicio', name='estado_enum'))

    # Relaciones
    delitos = relationship("Delito", back_populates="policia")
    faltas_leves = relationship("FaltaLeve", back_populates="policia")
    faltas_graves = relationship("FaltaGrave", back_populates="policia")

    def __repr__(self):
        return f"<Policia(nombre='{self.nombre}', apellido='{self.apellido}')>"

class Delito(Base):
    __tablename__ = 'Delito'

    id_delito = Column(Integer, primary_key=True, autoincrement=True)
    fecha_inicio = Column(Date)
    codigo_unico = Column(String(50), unique=True)
    tipo_penal = Column(String(100))
    con_detencion_preventiva = Column(String(100), nullable=True)
    con_detencion_domiciliaria = Column(String(100), nullable=True)
    con_sentencia_condenatoria_primera_instancia = Column(String(100), nullable=True)
    con_sentencia_ejecutoriada = Column(String(100), nullable=True)
    observaciones = Column(Text)
    id_policia = Column(Integer, ForeignKey('Policia.id_policia'))
    policia = relationship("Policia", back_populates="delitos")


class FaltaLeve(Base):
    __tablename__ = 'FaltaLeve'

    id_falta_leve = Column(Integer, primary_key=True, autoincrement=True)
    hoja_tramite_nro = Column(String(50))
    hoja_tramite_fecha = Column(Date)
    memorandum_nro = Column(String(50))
    memorandum_fecha = Column(Date)
    nro_oficio_archivo = Column(String(50))
    tipo_de_sancion = Column(SqlEnum(TipoSancion, native_enum=False), nullable=True)
    descripcion_sancion = Column(String(150), nullable=True)
    observaciones = Column(Text)
    id_policia = Column(Integer, ForeignKey('Policia.id_policia'))

    policia = relationship("Policia", back_populates="faltas_leves")


class FaltaGrave(Base):
    __tablename__ = 'FaltaGrave'

    id_falta_grave = Column(Integer, primary_key=True, autoincrement=True)
    nro_caso = Column(String(50), unique=True)
    fecha_ingreso = Column(Date, default=date.today)
    tipificacion = Column(Text)
    investigador_asignado = Column(String(150))
    fiscal_asignado = Column(String(150))
    defensa_asignado = Column(String(150))
    
    observaciones = Column(Text)
    id_policia = Column(Integer, ForeignKey('Policia.id_policia'))

    policia = relationship("Policia", back_populates="faltas_graves")
    etapas = relationship("Etapa", back_populates="falta_grave")

class Etapa(Base):
    __tablename__ = 'Etapa'

    id_etapa = Column(Integer, primary_key=True, autoincrement=True)
    id_falta_grave = Column(Integer, ForeignKey('FaltaGrave.id_falta_grave'))
    nombre_etapa = Column(String(150))
    descripcion = Column(Text)
    fecha_inicio = Column(Date)
    fecha_vencimiento = Column(Date)
    nivel = Column(Integer,default=0)
    falta_grave = relationship("FaltaGrave", back_populates="etapas")

class Usuario(Base):
    __tablename__ = 'Usuario'

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    user_name = Column(String(255))
    secret_name = Column(String(255))
    rol = Column(Enum('Supervisor', 'Editor', 'Lector', name='rol_enum'))
    cargo = Column(String(100))
    estado = Column(Integer, default=1) 
    logs = relationship("Log", back_populates="usuario")


class Log(Base):
    __tablename__ = 'Log'

    id_log = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('Usuario.id_usuario'))
    tabla_afectada = Column(String(100))
    id_registro = Column(Integer)
    accion = Column(Enum('crear', 'modificar','eliminar', name='accion_enum'))
    cambios = Column(Text)
    fecha = Column(TIMESTAMP, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="logs")
