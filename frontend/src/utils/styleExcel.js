// styleExcel.js
export function estiloDelito(ws, wb) {
  const totalCols = 13;
  const titleStyle = {
    font: { name: "Calibri", sz: 18, bold: true, underline: true },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };
  const headerStyle = {
    font: { name: "Calibri", sz: 13, bold: true },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "92D050" } },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };
  const dataStyle = {
    font: { name: "Calibri", sz: 11 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  ws["!cols"] = [
    { wch: 3.09 },
    { wch: 12.55 },
    { wch: 35.55 },
    { wch: 30.18 },
    { wch: 19.09 },
    { wch: 21.36 },
    { wch: 17.18 },
    { wch: 28.18 },
    { wch: 17.36 },
    { wch: 21.36 },
    { wch: 18.64 },
    { wch: 20.09 },
  ];

  // Alturas de filas
  const range = ws["!ref"];
  const lastRow = range ? parseInt(range.split(":")[1].replace(/\D/g, ""), 10) - 1 : 10;
  ws["!rows"] = [];
  ws["!rows"][0] = { hpt: 37.5 }; // título
  ws["!rows"][1] = { hpt: 15 };
  ws["!rows"][2] = { hpt: 99.8 };
  for (let r = 3; r <= lastRow; r++) ws["!rows"][r] = { hpt: 60.8 };

  // Función para convertir índice a letra de columna
  function colIndexToLetter(n) {
    let s = "";
    n++;
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  // Asignar estilos celda por celda
  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c < totalCols; c++) {
      const ref = `${colIndexToLetter(c)}${r + 1}`;
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };

      if (r === 0) {
        ws[ref].s = { ...(ws[ref].s || {}), ...titleStyle };
      } else if (r >= 1 && r <= 2) {
        ws[ref].s = { ...(ws[ref].s || {}), ...headerStyle };
      } else {
        ws[ref].s = { ...(ws[ref].s || {}), ...dataStyle };
      }
    }
  }
}

export function estiloFaltaGrave(ws, wb) {
  const totalCols = 30; // columnas totales según los anchos dados

  // === ESTILOS ===
  const titleStyle = {
    font: { name: "Arial", sz: 22, bold: true },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "B4C6E7" } },
  };

  const headerStyle = {
    font: { name: "Arial", sz: 11, bold: true },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const dataStyle = {
    font: { name: "Arial", sz: 8, bold: true },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  // === ANCHO DE COLUMNAS ===
  ws["!cols"] = [
    { wch: 5.82 }, { wch: 8.18 }, { wch: 17.18 }, { wch: 12.82 }, { wch: 10.36 },
    { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 },
    { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 }, { wch: 10.36 },
    { wch: 10.18 }, { wch: 10.55 }, { wch: 8.09 }, { wch: 8.09 }, { wch: 8.09 },
    { wch: 8.09 }, { wch: 8.09 }, { wch: 9.18 }, { wch: 8.09 }, { wch: 8.09 },
    { wch: 8.09 }, { wch: 8.09 }, { wch: 5.09 }, { wch: 5.09 }, { wch: 10.82 },
  ];

  // === ALTURAS DE FILAS ===
  const range = ws["!ref"];
  const lastRow = range ? parseInt(range.split(":")[1].replace(/\D/g, ""), 10) - 1 : 10;

  ws["!rows"] = [];
  ws["!rows"][0] = { hpt: 28.5 };
  ws["!rows"][1] = { hpt: 15 };
  ws["!rows"][2] = { hpt: 35.3 };
  ws["!rows"][3] = { hpt: 102.8 };

  for (let r = 4; r <= lastRow; r++) {
    ws["!rows"][r] = { hpt: 75.5 };
  }

  const rotarFila2Y3 = [ // columnas que ocupan dos filas de headers
    [9, 14],
    [25, 28],
  ];

  const rotarSoloFila3 = [ // columnas que ocupan solo fila 3
    [15, 24],
  ];
  // === convertir # columna a letra ===
  function colIndexToLetter(n) {
    let s = "";
    n++;
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function colInRange(c, ranges) {
    return ranges.some(([start, end]) => c >= start && c <= end);
  }
  // === Aplicar estilos celda x celda ===
  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c < ws["!cols"].length; c++) {
      const ref = `${colIndexToLetter(c)}${r + 1}`;
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };

      if (r === 0) {
        ws[ref].s = { ...(ws[ref].s || {}), ...titleStyle };
      } else if (r >= 1 && r <= 3) {
        ws[ref].s = { ...(ws[ref].s || {}), ...headerStyle };
      } else {
        ws[ref].s = { ...(ws[ref].s || {}), ...dataStyle };
      }
      if ((r === 2 && colInRange(c, rotarFila2Y3)) || // fila 2 → rotar columnas 2 filas
          (r === 3 && (colInRange(c, rotarFila2Y3) || colInRange(c, rotarSoloFila3)))) { // fila 3 → columnas 2 filas + solo fila3
        ws[ref].s.alignment = { ...(ws[ref].s.alignment || {}), textRotation: 90 };
      }
    }
  }
}

export function estiloFaltaLeve(ws, wb) {

  const totalCols = 16;

  const calibri = "Calibri";

  // ============================
  // 🎨 ESTILOS
  // ============================

  const titleCenter = {
    font: { name: calibri, bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center",wrapText: true }
  };

  const titleLeft = {
    font: { name: calibri, bold: true, sz: 11 },
    alignment: { horizontal: "left", vertical: "center", wrapText: true }
  };

  const dataBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  };
  const headerStyle = {
    font: { name: calibri, bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "ED7D31" } },
    border: dataBorder
  };

  
  const headerRotated = {
    font: { name: calibri, bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center", textRotation: 90, wrapText: true },
    fill: { fgColor: { rgb: "ED7D31" } },
    border: dataBorder
  };

  

  const dataStyleEven = {
    font: { name: calibri, sz: 7 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "F7CAAC" } },
    border: dataBorder
  };

  const dataStyleOdd = {
    font: { name: calibri, sz: 7 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "FBE4D5" } },
    border: dataBorder
  };

  const titleBg = "F4B083";

  // ============================
  // 🔤 CONVERSIÓN COL INDEX → LETRA
  // ============================

  function colIndexToLetter(n) {
    let s = "";
    n++;
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  // ============================
  // 📏 ALTURAS DE FILAS
  // ============================

  const range = ws["!ref"];
  const lastRow = range ? parseInt(range.split(":")[1].replace(/\D/g, ""), 10) - 1 : 10;

  ws["!rows"] = [];

  // 0–4 → 15
  for (let r = 0; r <= 4; r++) ws["!rows"][r] = { hpt: 15 };

  ws["!rows"][5] = { hpt: 64.5 };
  ws["!rows"][6] = { hpt: 83 };

  for (let r = 7; r <= lastRow; r++) ws["!rows"][r] = { hpt: 36 };

  // ============================
  // 📏 ANCHO DE COLUMNAS
  // ============================

  ws["!cols"] = [
    { wch: 5.36 }, { wch: 6.45 }, { wch: 10.45 }, { wch: 9.09 },
    { wch: 45.27 }, { wch: 15.18 }, { wch: 15.18 }, { wch: 8.82 },
    { wch: 8.82 }, { wch: 12.18 }, { wch: 8.82 }, { wch: 10.91 },
    { wch: 8.82 }, { wch: 12.09 }, { wch: 9.09 }, { wch: 15.64 }
  ];

  // ============================
  // 🎨 APLICAR ESTILOS CELDA POR CELDA
  // ============================

  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c < totalCols; c++) {
      const ref = `${colIndexToLetter(c)}${r + 1}`;
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };

      // PRIMERAS 5 FILAS → fondo salmón
      if (r <= 4) {
        ws[ref].s = {
          fill: { fgColor: { rgb: titleBg } },
          ...(ws[ref].s || {})
        };
      }

      // FILAS 0–1 → títulos centrados
      if (r === 0 || r === 1) {
        ws[ref].s = { ...(ws[ref].s || {}), ...titleCenter };
      }

      // FILA 2 → título izquierda
      if (r === 2) {
        ws[ref].s = { ...(ws[ref].s || {}), ...titleLeft };
      }

      // FILA 5 → cabecera
      if (r === 5) {
        ws[ref].s = { ...(ws[ref].s || {}), ...headerStyle };
      }

      // FILA 6 → cabecera rotada
      if (r === 6) {
        ws[ref].s = { ...(ws[ref].s || {}), ...headerRotated };
      }

      // FILAS 7+ → datos
      if (r >= 7) {
        const style = r % 2 === 0 ? dataStyleEven : dataStyleOdd;
        ws[ref].s = { ...(ws[ref].s || {}), ...style };
      }
    }
  }
}
