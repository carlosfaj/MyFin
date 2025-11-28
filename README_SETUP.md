# Guía de Uso - MyFin

## Importación de Datos Financieros

Para que el sistema funcione correctamente, debes importar tus estados financieros.

### Formato del Excel
El sistema espera un archivo Excel (`.xlsx`) con la siguiente estructura recomendada:

1. **Primera Fila (Encabezados):**
   - La primera columna debe ser para los conceptos (ej. "Ventas", "Activos").
   - Las siguientes columnas deben ser los años (ej. "2023", "2024").

2. **Filas de Datos:**
   - Cada fila debe contener el nombre de la cuenta y sus valores para cada año.

### Ejemplo:

| Concepto | 2024 | 2023 |
|----------|------|------|
| Ventas | 100000 | 90000 |
| Costo de Ventas | 60000 | 55000 |
| Activo Corriente | 20000 | 18000 |
| ... | ... | ... |

### Cuentas Clave
El sistema busca automáticamente palabras clave para calcular los ratios. Intenta usar nombres estándar como:
- **Estado de Resultados:** Ventas, Costo de Ventas, Gastos Operativos, Utilidad Neta, Gastos Financieros.
- **Balance General:** Activo Corriente, Pasivo Corriente, Inventario, Activo Total, Pasivo Total, Patrimonio.

## Pasos para Importar
1. Ve a la sección **Importar Datos**.
2. Selecciona tu archivo Excel.
3. Selecciona si es un "Estado de Resultados" o "Balance General" (si tienes ambos en el mismo archivo, impórtalo dos veces seleccionando el tipo correspondiente, o asegúrate de que el sistema pueda leerlo). *Nota: Actualmente el sistema importa todo el archivo bajo el tipo seleccionado, así que se recomienda tener hojas separadas o archivos separados si quieres ser muy preciso, aunque el buscador de cuentas es flexible.*
4. Haz clic en **Importar Datos**.

## Ver Resultados
Una vez importado:
- Ve a **Dashboard** o **Análisis Detallado**.
- Verás las gráficas y tablas con tus datos.
- Ve al **Asistente IA** y pregunta "¿Cómo está mi liquidez?" o "¿Qué me recomiendas para mejorar mi rentabilidad?". La IA usará tus datos cargados para responder.
