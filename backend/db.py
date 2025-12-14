import sqlite3

def crear_db():
    conn = sqlite3.connect("policia.db")
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS Policia (
        id_policia INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(255),
        grado VARCHAR(50),
        unidad_policial VARCHAR(100),
        estado TEXT CHECK(estado IN ('Descanso', 'Servicio')) DEFAULT 'Servicio'
    );

    CREATE TABLE IF NOT EXISTS Delito (
        id_delito INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_inicio DATE,
        codigo_unico VARCHAR(50) UNIQUE,
        tipo_penal VARCHAR(100),
        con_detencion_preventiva VARCHAR(100),
        con_detencion_domiciliaria VARCHAR(100),
        con_sentencia_condenatoria_primera_instancia VARCHAR(100),
        con_sentencia_ejecutoriada VARCHAR(100),
        observaciones TEXT,
        id_policia INTEGER,
        FOREIGN KEY (id_policia) REFERENCES Policia(id_policia)
    );

    CREATE TABLE IF NOT EXISTS FaltaLeve (
        id_falta_leve INTEGER PRIMARY KEY AUTOINCREMENT,
        hoja_tramite_nro VARCHAR(50),
        hoja_tramite_fecha DATE,
        memorandum_nro VARCHAR(50),
        memorandum_fecha DATE,
        nro_oficio_archivo VARCHAR(50),
        tipo_de_sancion TEXT CHECK(tipo_de_sancion IN (
            'ART_9_LLAMADA_DE_ATENCION_VERBAL',
            'ART_10_LLAMADA_DE_ATENCION_ESCRITA',
            'ART_10_ARRESTO_DE_1_A_3_DIAS',
            'ART_11_LLAMADA_DE_ATENCION_ESCRITA',
            'ART_11_ARRESTO_DE_4_A_10_DIAS',
            'REPRESENTACIONES'
        )),
        descripcion_sancion VARCHAR(150),
        observaciones TEXT,
        id_policia INTEGER,
        FOREIGN KEY (id_policia) REFERENCES Policia(id_policia)
    );

    CREATE TABLE IF NOT EXISTS FaltaGrave (
        id_falta_grave INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_caso VARCHAR(50) UNIQUE,
        fecha_ingreso DATE NOT NULL DEFAULT (DATE('now'))
        tipificacion TEXT,
        investigador_asignado VARCHAR(150),
        fiscal_asignado VARCHAR(150),
        defensa_asignado VARCHAR(150),
        observaciones TEXT,
        id_policia INTEGER,
        FOREIGN KEY (id_policia) REFERENCES Policia(id_policia)
    );

    CREATE TABLE IF NOT EXISTS Etapa (
        id_etapa INTEGER PRIMARY KEY AUTOINCREMENT,
        id_falta_grave INTEGER,
        nombre_etapa VARCHAR(150),
        descripcion TEXT,
        fecha_inicio DATE,
        fecha_vencimiento DATE,
        nivel INTEGER DEFAULT 0,
        FOREIGN KEY (id_falta_grave) REFERENCES FaltaGrave(id_falta_grave)
    );

    CREATE TABLE IF NOT EXISTS Usuario (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100),
        user_name VARCHAR(100),
        secret_name VARCHAR(255),
        rol TEXT CHECK(rol IN ('Supervisor', 'Editor', 'Lector')),
        cargo VARCHAR(100),
        estado INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Log (
        id_log INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER,
        tabla_afectada VARCHAR(100),
        id_registro INTEGER,
        accion TEXT CHECK(accion IN ('crear', 'modificar', 'eliminar')),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cambios TEXT,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    );
    """)

    conn.commit()
    conn.close()
    print("✅ Base de datos 'policia.db' creada correctamente.")


if __name__ == "__main__":
    crear_db()
