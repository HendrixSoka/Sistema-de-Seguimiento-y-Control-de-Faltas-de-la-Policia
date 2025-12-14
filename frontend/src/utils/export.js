import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { estiloDelito, estiloFaltaGrave, estiloFaltaLeve } from "./styleExcel.js";
/**
 * Devuelve la profundidad (niveles) del árbol de columnas
 */
function obtenerProfundidad(cols) {
  let max = 0;
  cols.forEach((c) => {
    const subs = c.subcolumnas
      ? c.subcolumnas.map((s) => (typeof s === "string" ? { label: s } : s))
      : null;
    const depth = subs ? 1 + obtenerProfundidad(subs) : 1;
    if (depth > max) max = depth;
  });
  return max;
}

/**
 * Rellena la matriz de headers y devuelve:
 * - matrix: array de arrays (filas x cols) con labels o ""
 * - merges: lista de merges en formato {s:{r,c}, e:{r,c}}
 * - leaves: array con labels de las columnas hoja en orden
 */
function construirHeaders(columnas) {
  // Normalizar subcolumnas strings -> objetos {label}
  const norm = (c) => {
    if (typeof c === "string") return { label: c };
    const base = { ...c };
    if (base.subcolumnas) {
      base.subcolumnas = base.subcolumnas.map((s) =>
        typeof s === "string" ? { label: s } : s
      );
    }
    return base;
  };

  const colsNorm = columnas.map(norm);
  const depth = obtenerProfundidad(colsNorm);
  // filas: depth (niveles), pero en la hoja pondremos +1 para el título luego
  const matrix = Array.from({ length: depth }, () =>
    Array.from({ length: 0 }, () => "")
  );

  const merges = [];
  const leaves = [];

  // contenedor para ir agregando columnas (colIndex se incrementa)
  let colIndex = 0;

  function procesarNodo(nodo, nivel) {
    const label = nodo.label;
    const subs = nodo.subcolumnas ? nodo.subcolumnas.map(norm) : null;

    if (!matrix[nivel]) {
      matrix[nivel] = [];
    }

    if (!subs || subs.length === 0) {
      // hoja
      // asegurarnos de que cada fila tenga la longitud suficiente
      for (let r = 0; r < depth; r++) {
        while (matrix[r].length < colIndex) matrix[r].push("");
      }
      matrix[nivel][colIndex] = label;
      // Si no llega hasta abajo, crear rowspan (merge vertical)
      const rowspan = depth - nivel;
      if (rowspan > 1) {
        merges.push({
          s: { r: nivel, c: colIndex },
          e: { r: nivel + rowspan - 1, c: colIndex },
        });
      }
      leaves.push(label);
      colIndex += 1;
      return 1; // produce 1 hoja
    } else {
      // nodo con subcolumnas
      const startCol = colIndex;
      let totalLeaves = 0;
      for (const sc of subs) {
        totalLeaves += procesarNodo(sc, nivel + 1);
      }
      const endCol = colIndex - 1;
      // colocar label en la fila actual, en startCol
      for (let r = 0; r < depth; r++) {
        while (matrix[r].length < startCol) matrix[r].push("");
      }
      matrix[nivel][startCol] = label;
      if (endCol > startCol) {
        // colspan: merge horizontal en la misma fila
        merges.push({ s: { r: nivel, c: startCol }, e: { r: nivel, c: endCol } });
      } else {
        // si solo abarca una columna hoja, pero está a un nivel superior, hay que hacer rowspan
        const rowspan = depth - nivel;
        if (rowspan > 1) {
          merges.push({
            s: { r: nivel, c: startCol },
            e: { r: nivel + rowspan - 1, c: startCol },
          });
        }
      }
      return totalLeaves;
    }
  }

  // inicializamos filas internas con arrays vacíos
  for (let i = 0; i < depth; i++) matrix[i] = [];

  for (const c of colsNorm) {
    procesarNodo(c, 0);
  }

  // Asegurar que todas las filas tengan la misma longitud (colIndex)
  for (let r = 0; r < depth; r++) {
    while (matrix[r].length < colIndex) matrix[r].push("");
  }

  return { matrix, merges, leaves, totalCols: colIndex, depth };
}


export function exportExcel(
  columnas,
  datos,
  mapaKeys = {},
  nombreArchivo = "reporte",
  titulos
) {
  const { matrix, merges, leaves, totalCols, depth } = construirHeaders(columnas);

  const finalMerges = [];
  const aoa = [];

  titulos.forEach((t) => {
    if (Array.isArray(t)) {
      const row = Array(totalCols).fill("");

      t.forEach((cell) => {
        const startCol = cell.col ?? 0;
        const span = cell.colSpan ?? 1;

        row[startCol] = cell.title ?? "";

        if (span > 1) {
          finalMerges.push({
            s: { r: aoa.length, c: startCol },
            e: { r: aoa.length, c: startCol + span - 1 }
          });
        }
      });

      aoa.push(row);
    }
    else {
      const row = Array(totalCols).fill("");
      const startCol = t.col ?? 0;
      const span = t.colSpan ?? 1;

      row[startCol] = t.title ?? "";

      aoa.push(row);

      if (span > 1) {
        finalMerges.push({
          s: { r: aoa.length - 1, c: startCol },
          e: { r: aoa.length - 1, c: startCol + span - 1 }
        });
      }
    }
  });

  for (let r = 0; r < depth; r++) {
    aoa.push(matrix[r].slice(0, totalCols));
  }

  const filasDatos = datos.map((item) =>
    leaves.map((label) => {
      const key = mapaKeys[label] ?? label;
      return item[key] ?? "";
    })
  );

  for (const f of filasDatos) aoa.push(f);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const desplazamiento = titulos.length;
  merges.forEach((m) => {
    finalMerges.push({
      s: { r: m.s.r + desplazamiento, c: m.s.c },
      e: { r: m.e.r + desplazamiento, c: m.e.c },
    });
  });

  ws["!merges"] = finalMerges;

  const colWidths = leaves.map((l) => ({
    wch: Math.max(10, Math.min(30, l.length + 5)),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");

  if(nombreArchivo === "Delitos"){
    estiloDelito(ws, wb);
  }else if(nombreArchivo === "FaltasGraves"){
    estiloFaltaGrave(ws, wb);
  }else if(nombreArchivo === "FaltasLeves"){
    estiloFaltaLeve(ws, wb);
  } 
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, `${nombreArchivo}.xlsx`);
}


export function exportExcelException(
  columnas,
  datos,
  nombreArchivo = "reporte",
  titulos
) {
  const { matrix, merges, leaves, totalCols, depth } = construirHeaders(columnas);

  const finalMerges = [];
  const aoa = [];

  titulos.forEach((t) => {
    if (Array.isArray(t)) {
      const row = Array(totalCols).fill("");

      t.forEach((cell) => {
        const startCol = cell.col ?? 0;
        const span = cell.colSpan ?? 1;

        row[startCol] = cell.title ?? "";

        if (span > 1) {
          finalMerges.push({
            s: { r: aoa.length, c: startCol },
            e: { r: aoa.length, c: startCol + span - 1 }
          });
        }
      });

      aoa.push(row);
    } else {
      const row = Array(totalCols).fill("");
      const startCol = t.col ?? 0;
      const span = t.colSpan ?? 1;

      row[startCol] = t.title ?? "";
      aoa.push(row);

      if (span > 1) {
        finalMerges.push({
          s: { r: aoa.length - 1, c: startCol },
          e: { r: aoa.length - 1, c: startCol + span - 1 }
        });
      }
    }
  });
  for (let r = 0; r < depth; r++) {
    aoa.push(matrix[r].slice(0, totalCols));
  }

  function obtenerValorEspecial(label, item, parentLabel = "") {
  const fullLabel = parentLabel ? `${parentLabel} ${label}` : label;
  if (fullLabel === "N°") return item.id_falta_leve ?? "";
  if (fullLabel === "GRADO") return item.grado ?? "";
  if (fullLabel === "DENUNCIADO(A)") return item.nombre ?? "";
  if (fullLabel === "HOJA DE TRÁMITE Nro") return item.hoja_tramite_nro ?? "";
  if (fullLabel === "HOJA DE TRÁMITE Fecha") return item.hoja_tramite_fecha ?? "";
  if (fullLabel === "MEMORÁNDUM Nro") return item.memorandum_nro ?? "";
  if (fullLabel === "MEMORÁNDUM Fecha") return item.memorandum_fecha ?? "";

  const tipos = [
    "ART. 9 LLAMADA DE ATENCION VERBAL",
    "ART. 10 LLAMADA DE ATENCION ESCRITA",
    "ART. 10 ARRESTO DE 1 A 3 DIAS",
    "ART. 11 LLAMADA DE ATENCION ESCRITA",
    "ART. 11 ARRESTO DE 4 A 10 DIAS",
    "REPRESENTACIONES",
  ];

  if (tipos.includes(label)) {
    return item.tipo_de_sancion === label ? "X" : "";
  }
  if (fullLabel === "DESCRIPCIÓN DE LA SANCIÓN DISCIPLINARIA IMPUESTA")
    return item.descripcion_sancion ?? "";

  if (fullLabel === "NRO. DE OFICIO DE ARCHIVO INSP.")
    return item.nro_oficio_archivo ?? "";

  if (fullLabel === "OBS.") return item.observaciones ?? "";

  return "";
}


  function findParentLabel(cols, leaf) {
    for (const col of cols) {
      if (col.subcolumnas) {
        for (const sub of col.subcolumnas) {
          const subLabel = typeof sub === "string" ? sub : sub.label;
          if (subLabel === leaf) return col.label;
        }
      }
    }
    return "";
  }

  const filasDatos = datos.map((item) =>
    leaves.map((leaf, colIndex) => {
      const parent = findParentLabel(columnas, leaf); 
      return obtenerValorEspecial(leaf, item, parent);
    })
  );

  for (const f of filasDatos) aoa.push(f);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const desplazamiento = titulos.length;
  merges.forEach((m) => {
    finalMerges.push({
      s: { r: m.s.r + desplazamiento, c: m.s.c },
      e: { r: m.e.r + desplazamiento, c: m.e.c },
    });
  });

  ws["!merges"] = finalMerges;

  const colWidths = leaves.map((l) => ({
    wch: Math.max(10, Math.min(30, l.length + 5)),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");

  if (nombreArchivo === "FaltasLeves") estiloFaltaLeve(ws, wb);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, `${nombreArchivo}.xlsx`);
}


export function exportExcelFaltasGraves(
  columnas,
  datos,
  nombreArchivo = "FaltasGraves",
  titulos
) {
  const { matrix, merges, leaves, totalCols, depth } = construirHeaders(columnas);
  const finalMerges = [];
  const aoa = [];

  // --- TITULOS ---
  titulos.forEach((t) => {
    if (Array.isArray(t)) {
      const row = Array(totalCols).fill("");

      t.forEach((cell) => {
        const startCol = cell.col ?? 0;
        const span = cell.colSpan ?? 1;

        row[startCol] = cell.title ?? "";

        if (span > 1) {
          finalMerges.push({
            s: { r: aoa.length, c: startCol },
            e: { r: aoa.length, c: startCol + span - 1 }
          });
        }
      });

      aoa.push(row);
    } else {
      const row = Array(totalCols).fill("");
      const startCol = t.col ?? 0;
      const span = t.colSpan ?? 1;

      row[startCol] = t.title ?? "";
      aoa.push(row);

      if (span > 1) {
        finalMerges.push({
          s: { r: aoa.length - 1, c: startCol },
          e: { r: aoa.length - 1, c: startCol + span - 1 },
        });
      }
    }
  });

  // --- CABECERAS ---
  for (let r = 0; r < depth; r++) {
    aoa.push(matrix[r].slice(0, totalCols));
  }


  // -------------------------------------------------------------------
  // 🎯 FUNCIONES ESPECIALES PARA ETAPAS
  // -------------------------------------------------------------------

  function obtenerValorEspecialFaltasGraves(label, item) {

    // --- CAMPOS DIRECTOS ---
    if (label === "N°") return item.id_falta_grave ?? "";
    if (label === "GRADO") return item.grado ?? "";
    if (label === "DENUNCIADO(A)/PROCESADO(A)") return item.nombre ?? "";
    if (label === "UNIDAD POLICIAL") return item.unidad_policial ?? "";
    if (label === "TIPIFICACIÓN (Art. / Inc.)") return item.tipificacion ?? "";
    if (label === "N° DE CASO") return item.nro_caso ?? "";
    if (label === "INVEST. ASIGNADO") return item.investigador_asignado ?? "";
    if (label === "FISCAL ASIGNADO") return item.fiscal_asignado ?? "";
    if (label === "DEFENSA") return item.defensa_asignado ?? "";
    if (label === "OBS.") return item.observaciones ?? "";


    // → helper interno
    function etapaValor(nombre) {
      if (!item.etapas) return "";

      // normalizar solo el nombre recibido (label del Excel)
      const norm = (s) =>
        s
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")  // quita tildes
          .toUpperCase()
          .trim();

      const buscado = norm(nombre);

      // comparar normalizado del label contra nombre_etapa sin modificar
      const etapa = item.etapas.find(
        (e) => e.nombre_etapa === buscado
      );

      if (!etapa) return "";

      const fecha = etapa.fecha_inicio
        ? new Date(etapa.fecha_inicio).toLocaleDateString()
        : "";
      const desc = etapa.descripcion ?? "";

      if (fecha && desc) return `${fecha} ${desc}`;
      if (fecha) return fecha;
      if (desc) return desc;
      return "";
    }



    // --- LISTA DE ETAPAS ---
    if (label === "FECHA RECEPCIÓN (DIDIPI)") return etapaValor(label);
    if (label === "FECHA SUBSANACIÓN (DIDIPI)") return etapaValor(label);
    if (label === "FECHA DESESTIMACIÓN (FISCALÍA)") return etapaValor(label);
    if (label === "FECHA INICIO INVESTIGACIÓN") return etapaValor(label);
    if (label === "FECHA RECHAZO DENUNCIA") return etapaValor(label);
    if (label === "FECHA ACUSACIÓN FISCAL") return etapaValor(label);

    if (label === "AUTO DE APERTURA") return etapaValor(label);
    if (label === "ALEGATOS INICIALES") return etapaValor(label);
    if (label === "INTERROGATORIO PROCESADO(A)") return etapaValor(label);
    if (label === "PRESENTACIÓN DE PRUEBAS DE CARGO") return etapaValor(label);
    if (label === "PRESENTACIÓN DE PRUEBAS DE DESCARGO") return etapaValor(label);
    if (label === "ALEGATOS FINALES") return etapaValor(label);
    if (label === "DELIBERACIÓN Y LECTURA DE RESOLUCIÓN") return etapaValor(label);
    if (label === "NOTIFICACIÓN CON LA RESOLUCIÓN DE 1º INSTANCIA") return etapaValor(label);

    if (label === "RETIRO TEMPORAL (1-2 AÑOS)") return etapaValor(label);
    if (label === "BAJA DEFINITIVA") return etapaValor(label);

    if (label === "RESOLUCIÓN ABSOLUTORIA") return etapaValor(label);
    if (label === "EXTINCIÓN POR PRESCRIPCIÓN") return etapaValor(label);
    if (label === "EXTINCIÓN POR COSA JUZGADA") return etapaValor(label);
    if (label === "OTROS") return etapaValor(label);

    return "";
  }



  // -------------------------------------------------------------------
  // 🎯 FILAS DE DATOS (sin mapaKeys)
  // -------------------------------------------------------------------
  const filasDatos = datos.map(item =>
    leaves.map(label => obtenerValorEspecialFaltasGraves(label,item))
  );

  filasDatos.forEach(f => aoa.push(f));

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Aplicar merges desplazados
  const despl = titulos.length;
  merges.forEach((m) => {
    finalMerges.push({
      s: { r: m.s.r + despl, c: m.s.c },
      e: { r: m.e.r + despl, c: m.e.c },
    });
  });

  ws["!merges"] = finalMerges;

  // Ancho auto
  ws["!cols"] = leaves.map((l) => ({
    wch: Math.max(10, Math.min(30, l.length + 5)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");

  estiloFaltaGrave(ws, wb);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  saveAs(blob, `${nombreArchivo}.xlsx`);
}


export function exportarTablaExcel(data, fecha_inicio = null, fecha_fin = null) {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // =========================
  // TÍTULO DINÁMICO
  // =========================
  let titulo = "Reporte de policías — Todos los registros";

  if (fecha_inicio && fecha_fin) {
    titulo = `Reporte de policías — Registros del ${fecha_inicio} al ${fecha_fin}`;
  } else if (fecha_inicio) {
    titulo = `Reporte de policías — Registros desde ${fecha_inicio}`;
  } else if (fecha_fin) {
    titulo = `Reporte de policías — Registros hasta ${fecha_fin}`;
  }

  // Encabezados
  const headers = [
    "Nombre",
    "Grado",
    "Unidad",
    "Delitos",
    "Faltas Graves",
    "Faltas Leves",
  ];

  const rows = data.map(p => [
    p.nombre,
    p.grado,
    p.unidad_policial,
    p.total_delitos,
    p.total_faltas_graves,
    p.total_faltas_leves,
  ]);

  // Título + fila vacía + encabezados + datos
  const worksheetData = [
    [titulo],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // =========================
  // ESTILOS
  // =========================

  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "2B6CB0" } },
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "3182CE" } },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const cellStyle = {
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  // =========================
  // APLICAR ESTILOS
  // =========================

  // Título (fila 0, columna A)
  worksheet["A1"].s = titleStyle;

  // Fusionar título (A1:F1)
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  ];

  // Encabezados (fila 2)
  for (let C = 0; C <= 5; C++) {
    const cell = XLSX.utils.encode_cell({ r: 2, c: C });
    worksheet[cell].s = headerStyle;
  }

  // Celdas de datos (desde fila 3)
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  for (let R = 3; R <= range.e.r; R++) {
    for (let C = 0; C <= 5; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (worksheet[cell]) {
        worksheet[cell].s = cellStyle;
      }
    }
  }

  // Ancho de columnas
  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
  ];

  // =========================
  // EXPORTAR
  // =========================

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Policías");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    "reporte_policias.xlsx"
  );
}