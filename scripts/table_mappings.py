"""Column-by-column mappings from legacy SQL Server tables to PostgreSQL SQLAlchemy models.

Each mapping entry:
- target_schema: SQLAlchemy model module (catalogo, sistema, etc.)
- target_table: DB table name in snake_case
- columns: {legacy_col: {"target": target_col, "type": data_type}}
- legacy_pk: Primary key column(s) in the legacy table
- dependency_layer: Import order (0=no deps, higher=more deps)
- has_legacy_id: False if target model has no legacy_id column (default True)
- lookup_column: For models without legacy_id, which column to use for FK lookups
- notes: Optional special handling instructions

Column type values:
  str     - varchar/nvarchar → string
  int     - int/identity → integer
  float   - decimal/numeric → float
  money   - money/smallmoney → Numeric(15,2)
  date    - date → date
  datetime - datetime/smalldatetime → datetime
"""

MAPPINGS = {
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 0 — Reference/catalog tables (no FK dependencies)
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_SUNAT01_TipoMedioPago": {
        "target_schema": "catalogo",
        "target_table": "tipo_medio_pago",
        "columns": {
            "SUNAT01_Id_Pago": {"target": "legacy_id", "type": "str"},
            "SUNAT01_TipoMedioPago": {"target": "nombre", "type": "str"},
            "SUNAT01_MedioPago": {"target": "abreviatura", "type": "str"},
        },
        "defaults": {"codigo": "_from_legacy_id", "is_active": True},
        "legacy_pk": "SUNAT01_Id_Pago",
        "dependency_layer": 0,
    },
    "tbl_SUNAT06_UnidadMedida": {
        "target_schema": "catalogo",
        "target_table": "unidad_medida",
        "columns": {
            "SUNAT06_Id_UM": {"target": "legacy_id", "type": "str"},
            "SUNAT06_UnidadMedida": {"target": "nombre", "type": "str"},
            "SUNAT06_UM": {"target": "abreviatura", "type": "str"},
        },
        "defaults": {"codigo": "_from_legacy_id", "is_active": True},
        "legacy_pk": "SUNAT06_Id_UM",
        "dependency_layer": 0,
        "notes": "No PK in legacy table (heap). SUNAT06_Id_UM used as logical PK.",
    },
    "tbl_SUNAT10_TipoComprobante": {
        "target_schema": "catalogo",
        "target_table": "tipo_comprobante",
        "columns": {
            "SUNAT10_CodigoTipoComprobante": {"target": "legacy_id", "type": "str"},
            "SUNAT10_TipoComprobante": {"target": "nombre", "type": "str"},
            "SUNAT10_Comprobante": {"target": "abreviatura", "type": "str"},
        },
        "defaults": {"codigo": "_from_legacy_id", "is_active": True},
        "legacy_pk": "SUNAT10_CodigoTipoComprobante",
        "dependency_layer": 0,
    },
    "tbl_SUNAT12_TipoOperacion": {
        "target_schema": "catalogo",
        "target_table": "tipo_operacion",
        "columns": {
            "SUNAT12_TipoOperacion": {"target": ["legacy_id", "nombre"], "type": "str"},
            "SUNAT12_Cod_Operacion": {"target": "codigo", "type": "str"},
            "SUNAT12_IngresoSalida": {"target": "ingreso_salida", "type": "str"},
            "SUNAT12_DocInterno": {"target": "documento_interno", "type": "str"},
            "SUNAT12_ClienteProveedor": {"target": "cliente_proveedor", "type": "str"},
        },
        "defaults": {"is_active": True},
        "legacy_pk": "SUNAT12_TipoOperacion",
        "dependency_layer": 0,
        "notes": "PK is the name itself. Maps to both legacy_id and nombre.",
    },
    "tbl_G00001_UnidadOperativa": {
        "target_schema": "sistema",
        "target_table": "unidad_operativa",
        "columns": {
            "G00001_Id_UnidadOperativa": {"target": "legacy_id", "type": "str"},
            "G00001_CodigoUnidadOperativa": {"target": "codigo", "type": "str"},
            "G00001_UnidadOperativa": {"target": "nombre", "type": "str"},
            "G00001_Proyecto": {"target": "descripcion", "type": "str"},
        },
        "defaults": {"is_active": True},
        "legacy_pk": "G00001_Id_UnidadOperativa",
        "dependency_layer": 0,
    },
    "tbl_G00004_Rol": {
        "target_schema": "sistema",
        "target_table": "rol",
        "columns": {
            "G00004_Id_Rol": {"target": "codigo", "type": "int_to_str"},
            "G00004_Rol": {"target": "nombre", "type": "str"},
        },
        "defaults": {"nivel": 3, "is_active": True},
        "legacy_pk": "G00004_Id_Rol",
        "has_legacy_id": False,
        "lookup_column": "codigo",
        "dependency_layer": 0,
        "notes": "No legacy_id on target. PK int → codigo string for FK lookups.",
    },
    "tbl_G00006_Permiso": {
        "target_schema": "sistema",
        "target_table": "permiso",
        "columns": {
            "G00006_Id_Permiso": {"target": "legacy_id", "type": "int_to_str"},
            "G00006_Proceso": {"target": "proceso", "type": "str"},
            "G00006_Modulo": {"target": "modulo", "type": "str"},
            "G00006_Permiso": {"target": "permiso", "type": "str"},
        },
        "defaults": {"is_active": True},
        "legacy_pk": "G00006_Id_Permiso",
        "dependency_layer": 0,
    },
    "tbl_C06001_Categoria": {
        "target_schema": "logistica",
        "target_table": "categoria",
        "columns": {
            "C06001_IdCategoria": {"target": ["legacy_id", "codigo"], "type": "str"},
            "C06001_Categoria": {"target": "nombre", "type": "str"},
            "C06001_Descripcion": {"target": "descripcion", "type": "str"},
        },
        "legacy_pk": "C06001_IdCategoria",
        "dependency_layer": 0,
    },
    "tbl_C04001_CentroCosto": {
        "target_schema": "administracion",
        "target_table": "centro_costo",
        "columns": {
            "C04001_CodPartida": {"target": ["legacy_id", "codigo"], "type": "str"},
            "C04001_Partida": {"target": "nombre", "type": "str"},
            # Hierarchical N1/N2/N3 columns skipped — can be derived from codigo
        },
        "legacy_pk": "C04001_CodPartida",
        "dependency_layer": 0,
    },
    "tbl_C08009_TipoEquipo": {
        "target_schema": "equipo",
        "target_table": "tipo_equipo",
        "columns": {
            "C08009_IdTipoEquipo": {"target": "codigo", "type": "str"},
            "C08009_TipoEquipo": {"target": "nombre", "type": "str"},
            "C08009_Categoria": {"target": "categoria_prd", "type": "str"},
            "C08009_Codificacion": {"target": "descripcion", "type": "str"},
        },
        "defaults": {"activo": True},
        "legacy_pk": "C08009_IdTipoEquipo",
        "has_legacy_id": False,
        "lookup_column": "codigo",
        "dependency_layer": 0,
        "notes": "No legacy_id on target. Uses codigo (unique) for FK lookups.",
    },
    "tbl_C02000_ListaActoCondicionInseguro": {
        "target_schema": "sst",
        "target_table": "lista_acto_condicion_inseguro",
        "columns": {
            "C02000_CodigoActoCondicion": {
                "target": ["legacy_id", "codigo"],
                "type": "str",
            },
            "C02000_ActoCondicion": {"target": "acto_condicion", "type": "str"},
            # Note: legacy column has typo 'CategoriaActoCondicionn' (double n)
            "C02000_CategoriaActoCondicionn": {"target": "categoria", "type": "str"},
        },
        "legacy_pk": "C02000_CodigoActoCondicion",
        "dependency_layer": 0,
    },
    "tbl_C10001_CajaChica": {
        "target_schema": "administracion",
        "target_table": "caja_chica",
        "columns": {
            "C10001_NumCaja": {"target": ["legacy_id", "numero_caja"], "type": "str"},
            "C10001_SaldoInicial": {"target": "saldo_inicial", "type": "money"},
            "C10001_IngresoTotal": {"target": "ingreso_total", "type": "money"},
            "C10001_SalidaTotal": {"target": "salida_total", "type": "money"},
            "C10001_SaldoFinal": {"target": "saldo_final", "type": "money"},
            "C10001_FechaApertura": {"target": "fecha_apertura", "type": "date"},
            "C10001_FechaCierre": {"target": "fecha_cierre", "type": "date"},
            "C10001_Estatus": {"target": "estatus", "type": "str"},
        },
        "legacy_pk": "C10001_NumCaja",
        "dependency_layer": 0,
    },
    "tbl_C07002_CriterioSeleccionEvaluacion": {
        "target_schema": "proveedores",
        "target_table": "criterio_seleccion_evaluacion",
        "columns": {
            "C07002_IdCriterio": {"target": "legacy_id", "type": "int_to_str"},
            "C07002_SeleccionEvaluacion": {
                "target": "seleccion_evaluacion",
                "type": "str",
            },
            "C07002_ProveedorDe": {"target": "proveedor_de", "type": "str"},
            "C07002_Aspecto": {"target": "aspecto", "type": "str"},
            "C07002_AspectoPeso": {"target": "aspecto_peso", "type": "float"},
            "C07002_CriterioSeleccion": {"target": "criterio_seleccion", "type": "str"},
            "C07002_CriterioSeleccionPeso": {
                "target": "criterio_seleccion_peso",
                "type": "float",
            },
            "C07002_Parametro": {"target": "parametro", "type": "str"},
            "C07002_Punto": {"target": "punto", "type": "float"},
            "C07002_Puntaje": {"target": "puntaje", "type": "float"},
            "C07002_RegistradoPor": {"target": "registrado_por", "type": "str"},
            "C07002_FechaRegistro": {"target": "fecha_registro", "type": "datetime"},
        },
        "legacy_pk": "C07002_IdCriterio",
        "dependency_layer": 0,
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 1 — Tables depending on layer 0 reference data
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_G00002_Usuario": {
        "target_schema": "sistema",
        "target_table": "usuario",
        "columns": {
            "G00002_DNI": {"target": ["legacy_id", "dni"], "type": "str"},
            "G00002_Usuario": {"target": "nombre_usuario", "type": "str"},
            "G00002_Contraseña": {"target": "contrasena", "type": "str"},
            "G00002_Email": {"target": "correo_electronico", "type": "str"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
            "G00002_Estado": {"target": "is_active", "type": "str_to_bool"},
        },
        "defaults": {"is_active": True},
        "legacy_pk": "G00002_DNI",
        "dependency_layer": 1,
        "notes": "is_active: 'ACTIVO'→True, else False. _fk_ columns resolved at runtime.",
    },
    "tbl_C07001_Proveedor": {
        "target_schema": "proveedores",
        "target_table": "proveedor",
        "columns": {
            "C07001_RUC": {"target": ["legacy_id", "ruc"], "type": "str"},
            "C07001_RazonSocial": {"target": "razon_social", "type": "str"},
            "C07001_Direccion": {"target": "direccion", "type": "str"},
            "C07001_ProveedorDe": {"target": "tipo_proveedor", "type": "str"},
            "C07001_Correo": {"target": "correo_electronico", "type": "str"},
            "C07001_Celular": {"target": "telefono", "type": "str"},
        },
        "legacy_pk": "C07001_RUC",
        "dependency_layer": 1,
        "notes": "Financial info (bank accounts) and contacts skipped — separate models.",
    },
    "tbl_C05000_Trabajador": {
        "target_schema": "rrhh",
        "target_table": "trabajador",
        "columns": {
            "C05000_DNI": {"target": ["legacy_id", "dni"], "type": "str"},
            "C05000_Nombre": {"target": "nombres", "type": "str"},
            "C05000_Apellido": {"target": "apellido_paterno", "type": "str"},
            "C05000_FechaNacimiento": {"target": "fecha_nacimiento", "type": "date"},
            "C05000_Celular1": {"target": "telefono", "type": "str"},
            "C05000_Email1": {"target": "correo_electronico", "type": "str"},
        },
        "legacy_pk": "C05000_DNI",
        "dependency_layer": 1,
    },
    "tbl_A02001_EDT": {
        "target_schema": "proyectos",
        "target_table": "edt",
        "columns": {
            "A02001_Id_EDT": {"target": "legacy_id", "type": "int_to_str"},
            "A02001_Cod_EDT": {"target": "codigo", "type": "str"},
            "A02001_EDT": {"target": "nombre", "type": "str"},
            "A02001_Cod_EDT_Alfanumerico": {"target": "descripcion", "type": "str"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
            "G00001_Estado": {"target": "estado", "type": "str"},
        },
        "defaults": {"is_active": True},
        "legacy_pk": "A02001_Id_EDT",
        "dependency_layer": 1,
    },
    "tbl_G00007_ComponenteUnidadOperativa": {
        "target_schema": "sistema",
        "target_table": "componente_unidad_operativa",
        "columns": {
            "G00007_Id_Componente": {"target": "legacy_id", "type": "str"},
            "G00007_Componente": {"target": "componente", "type": "str"},
            "G00007_CodComponente": {"target": "codigo", "type": "str"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
        },
        "legacy_pk": "G00007_Id_Componente",
        "dependency_layer": 1,
    },
    "tbl_G00005_RolPermiso": {
        "target_schema": "sistema",
        "target_table": "rol_permiso",
        "columns": {
            "G00005_Id_RolPermiso": {"target": "id", "type": "int"},
            "G00004_Id_Rol": {"target": "_fk_rol", "type": "int"},
            "G00006_Id_Permiso": {"target": "_fk_permiso", "type": "int"},
        },
        "legacy_pk": "G00005_Id_RolPermiso",
        "dependency_layer": 1,
        "notes": "M2M table. FK columns resolved via runtime lookup dicts.",
    },
    "tbl_C06002_Producto": {
        "target_schema": "logistica",
        "target_table": "producto",
        "columns": {
            "C06002_IdProducto": {"target": ["legacy_id", "codigo"], "type": "str"},
            "C06001_IdCategoria": {"target": "categoria", "type": "str"},
            "C06002_Producto": {"target": "nombre", "type": "str"},
            "C06002_UM": {"target": "unidad_medida", "type": "str"},
            "C06002_Descripcion": {"target": "descripcion", "type": "str"},
        },
        "legacy_pk": "C06002_IdProducto",
        "dependency_layer": 1,
        "notes": "categoria stored as string (not FK). unidad_medida stored as string.",
    },
    "tbl_C04006_CuentaCajaBanco": {
        "target_schema": "administracion",
        "target_table": "cuenta_caja_banco",
        "columns": {
            # NOTE: Table is C04006 but columns use C04005_ prefix
            "C04005_NumCuenta": {
                "target": ["legacy_id", "numero_cuenta"],
                "type": "str",
            },
            "C04005_Cuenta": {"target": "cuenta", "type": "str"},
            "C04005_AccesoProyecto": {"target": "acceso_proyecto", "type": "str"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
            "C04005_Estatus": {"target": "estatus", "type": "str"},
        },
        "legacy_pk": "C04005_NumCuenta",
        "dependency_layer": 1,
        "notes": "Column prefix mismatch: table is C04006 but columns use C04005_.",
    },
    "tbl_C06003_SolicitudMaterial": {
        "target_schema": "logistica",
        "target_table": "solicitud_material",
        "columns": {
            "C06003_IdSolicitudMaterial": {"target": "legacy_id", "type": "int_to_str"},
            "C06003_Motivo": {"target": "motivo", "type": "str"},
            "C06003_FechaSolicitud": {"target": "fecha_solicitud", "type": "datetime"},
            "C06003_SolicitadoPor": {"target": "solicitado_por", "type": "str"},
        },
        "legacy_pk": "C06003_IdSolicitudMaterial",
        "dependency_layer": 1,
    },
    "tbl_C06005_Requerimiento": {
        "target_schema": "logistica",
        "target_table": "requerimiento",
        "columns": {
            "C06005_NumRequerimiento": {
                "target": ["legacy_id", "numero_requerimiento"],
                "type": "int",
            },
            "C06005_Motivo": {"target": "motivo", "type": "str"},
            "C06005_FechaRequerimiento": {
                "target": "fecha_requerimiento",
                "type": "datetime",
            },
            "C06005_SolicitadoPor": {"target": "solicitado_por", "type": "str"},
        },
        "legacy_pk": "C06005_NumRequerimiento",
        "dependency_layer": 1,
        "notes": "No PK in legacy table (heap).",
    },
    "tbl_C06007_Cotizacion": {
        "target_schema": "logistica",
        "target_table": "cotizacion_logistica",
        "columns": {
            "C06007_IdNumCotizacion": {
                "target": ["legacy_id", "numero_cotizacion"],
                "type": "int",
            },
        },
        "legacy_pk": "C06007_IdNumCotizacion",
        "dependency_layer": 1,
        "notes": "Single-column table. Only stores the cotizacion number.",
    },
    "tbl_C07003_SeleccionProveedor": {
        "target_schema": "proveedores",
        "target_table": "seleccion_proveedor",
        "columns": {
            "C07003_IdSeleccion": {"target": "legacy_id", "type": "int_to_str"},
        },
        "legacy_pk": "C07003_IdSeleccion",
        "dependency_layer": 1,
        "notes": "Single-column table, no PK in legacy.",
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 2 — Tables depending on layer 1
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_G00003_UsuarioRolUnidadOperativa": {
        "target_schema": "sistema",
        "target_table": "usuario_rol_unidad_operativa",
        "columns": {
            "G00003_Id_UsuarioRolUnidadOperativa": {
                "target": "legacy_id",
                "type": "int_to_str",
            },
            "G00002_DNI": {"target": "_fk_usuario", "type": "str"},
            "G00004_Id_Rol": {"target": "_fk_rol", "type": "int"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
        },
        "legacy_pk": "G00003_Id_UsuarioRolUnidadOperativa",
        "dependency_layer": 2,
    },
    "tbl_C08001_Equipo": {
        "target_schema": "equipo",
        "target_table": "equipo",
        "columns": {
            "C08001_CodigoEquipo": {
                "target": ["legacy_id", "codigo_equipo"],
                "type": "str",
            },
            "C07001_RucProveedor": {"target": "_fk_proveedor", "type": "str"},
            "C08001_TipoProveedor": {"target": "tipo_proveedor", "type": "str"},
            "C08001_Placa": {"target": "placa", "type": "str"},
            "C08001_Marca": {"target": "marca", "type": "str"},
            "C08001_Modelo": {"target": "modelo", "type": "str"},
            "C08001_SerieEquipo": {"target": "numero_serie_equipo", "type": "str"},
            "C08001_NumChasis": {"target": "numero_chasis", "type": "str"},
            "C08001_SerieMotor": {"target": "numero_serie_motor", "type": "str"},
            "C08001_PotenciaNeta": {"target": "potencia_neta", "type": "str"},
            "C08001_AñoFabricacion": {
                "target": "anio_fabricacion",
                "type": "str_to_int",
            },
            "C08001_FechaVencePoliza": {"target": "fecha_venc_poliza", "type": "date"},
            "C08001_FechaVenceSoat": {"target": "fecha_venc_soat", "type": "date"},
            "C08001_FechaVenceCITV": {"target": "fecha_venc_citv", "type": "date"},
            "C08001_TipoHoroOdo": {"target": "medidor_uso", "type": "str"},
            "C08001_Estatus": {"target": "estado", "type": "str"},
        },
        "legacy_pk": "C08001_CodigoEquipo",
        "dependency_layer": 2,
        "notes": "tipo_equipo_id needs runtime resolution from equipo code pattern. "
        "C07001_RazonSocial skipped (denormalized).",
    },
    "tbl_C05027_RegistroTrabajador": {
        "target_schema": "rrhh",
        "target_table": "registro_trabajador",
        "columns": {
            "C05027_Id_RegistroTrabajador": {
                "target": "legacy_id",
                "type": "int_to_str",
            },
            "G00001_Id_UnidadOperativa": {
                "target": "unidad_operativa_legacy_id",
                "type": "str",
            },
            "C05000_DNI": {"target": "trabajador_dni", "type": "str"},
            "C07001_RUC": {"target": "proveedor_ruc", "type": "str"},
            "C05027_FechaIngreso": {"target": "fecha_ingreso", "type": "date"},
            "C05027_FechaCese": {"target": "fecha_cese", "type": "date"},
            "C05027_Estatus": {"target": "estatus", "type": "str"},
            "C05027_FechaRegistro": {"target": "fecha_registro", "type": "date"},
            # Note: some columns use C0527_ prefix (missing '05' in middle)
            "C0527_RegistradoPor": {"target": "registrado_por", "type": "str"},
            "C0527_SubGrupo": {"target": "sub_grupo", "type": "str"},
        },
        "legacy_pk": "C05027_Id_RegistroTrabajador",
        "dependency_layer": 2,
        "notes": "Uses legacy_id strings for refs (not int FKs). "
        "C0527_ prefix for some columns (legacy inconsistency).",
    },
    "tbl_C04002_CuentasPorPagar": {
        "target_schema": "administracion",
        "target_table": "cuenta_por_pagar",
        "columns": {
            "C04002_IdCuentaPagar": {"target": "legacy_id", "type": "str"},
            "C04002_DNI_RUC": {"target": "_fk_proveedor", "type": "str"},
            "C04002_Comprobante": {"target": "numero_factura", "type": "str"},
            "C04002_FechaEmision": {"target": "fecha_emision", "type": "date"},
            "C04002_FechaVencimiento": {"target": "fecha_vencimiento", "type": "date"},
            "C04002_MontoConIGV": {"target": "monto_total", "type": "money"},
            "C04002_MontoFinal": {"target": "saldo", "type": "money"},
            "C04002_Moneda": {"target": "moneda", "type": "str"},
            "C04002_EstatusCuentaPorPgar": {"target": "estado", "type": "str"},
        },
        "legacy_pk": "C04002_IdCuentaPagar",
        "dependency_layer": 2,
        "notes": "Large table (~9.8MB). Many legacy columns unmapped (IGV details, "
        "detraccion, retencion, links, audit fields). "
        "proveedor_id is required NOT NULL — must resolve _fk_proveedor.",
    },
    "tbl_C07004_EvaluacionProveedor": {
        "target_schema": "proveedores",
        "target_table": "evaluacion_proveedor",
        "columns": {
            "C07004_IdEvaluacion": {"target": "legacy_id", "type": "int_to_str"},
            "C07001_RUC": {"target": "ruc", "type": "str"},
            "C07004_RazonSocial": {"target": "razon_social", "type": "str"},
            "C07004_Precio": {"target": "precio", "type": "str"},
            "C07004_PlazoPago": {"target": "plazo_pago", "type": "str"},
            "C07004_Calidad": {"target": "calidad", "type": "str"},
            "C07004_PlazoCumplimiento": {"target": "plazo_cumplimiento", "type": "str"},
            "C07004_Ubicacion": {"target": "ubicacion", "type": "str"},
            "C07004_AtencionCliente": {"target": "atencion_cliente", "type": "str"},
            "C07004_SGC": {"target": "sgc", "type": "str"},
            "C07004_SGSST": {"target": "sgsst", "type": "str"},
            "C07004_SGA": {"target": "sga", "type": "str"},
            "C07004_Puntaje": {"target": "puntaje", "type": "float"},
            "C07004_Resultado": {"target": "resultado", "type": "str"},
            "C07004_Accion": {"target": "accion", "type": "str"},
            "C07004_ParametroValor": {"target": "parametro_valor", "type": "str"},
            "C07004_Observacion": {"target": "observacion", "type": "str"},
            "C07004_FechaEvaluacion": {
                "target": "fecha_evaluacion",
                "type": "datetime",
            },
            "C07004_EvaluadoPor": {"target": "evaluado_por", "type": "str"},
        },
        "legacy_pk": "C07004_IdEvaluacion",
        "dependency_layer": 2,
    },
    "tbl_C06004_DetalleSolicitudMaterial": {
        "target_schema": "logistica",
        "target_table": "detalle_solicitud_material",
        "columns": {
            "C06004_IdDetalleRequerimiento": {
                "target": "legacy_id",
                "type": "int_to_str",
            },
            "C06003_IdRequerimiento": {"target": "solicitud_legacy_id", "type": "str"},
            "C06004_IdProducto": {"target": "producto_legacy_id", "type": "str"},
            "C06004_Producto": {"target": "producto", "type": "str"},
            "C06004_Cantidad": {"target": "cantidad", "type": "float"},
            "C06004_UM": {"target": "unidad_medida", "type": "str"},
            "C06004_FechaRequerida": {"target": "fecha_requerida", "type": "date"},
            "C06004_MarcaSugerida": {"target": "marca_sugerida", "type": "str"},
            "C06004_Descripcion": {"target": "descripcion", "type": "str"},
            "C06004_Link": {"target": "link", "type": "str"},
            "C06004_Estatus": {"target": "estatus", "type": "str"},
        },
        "legacy_pk": "C06004_IdDetalleRequerimiento",
        "dependency_layer": 2,
        "notes": "No PK in legacy. Uses legacy_id strings for solicitud/producto refs.",
    },
    "tbl_C06006_DetalleRequerimiento": {
        "target_schema": "logistica",
        "target_table": "detalle_requerimiento",
        "columns": {
            "C06006_IdDetalleRequerimiento": {
                "target": "legacy_id",
                "type": "int_to_str",
            },
            "C06005_NumRequerimiento": {
                "target": "requerimiento_legacy_id",
                "type": "str",
            },
            "C06006_IdProducto": {"target": "producto_legacy_id", "type": "str"},
            "C06006_Producto": {"target": "producto", "type": "str"},
            "C06006_Cantidad": {"target": "cantidad", "type": "float"},
            "C06006_UM": {"target": "unidad_medida", "type": "str"},
            "C06006_FechaRequerida": {"target": "fecha_requerida", "type": "date"},
            "C06006_MarcaSugerida": {"target": "marca_sugerida", "type": "str"},
            "C06006_Descripcion": {"target": "descripcion", "type": "str"},
            "C06006_Link": {"target": "link", "type": "str"},
            "C06006_Estatus": {"target": "estatus", "type": "str"},
        },
        "legacy_pk": "C06006_IdDetalleRequerimiento",
        "dependency_layer": 2,
        "notes": "No PK in legacy. Structure mirrors DetalleSolicitudMaterial.",
    },
    "tbl_C10001_SolicitudCaja": {
        "target_schema": "administracion",
        "target_table": "solicitud_caja",
        "columns": {
            "C10001_NumSolicitud": {"target": "legacy_id", "type": "int_to_str"},
            "C10001_FechaSolicitud": {"target": "fecha_solicitud", "type": "datetime"},
            "DNI_Usuario": {"target": "dni_usuario", "type": "str"},
            "Nombre": {"target": "nombre", "type": "str"},
            "C10001_Motivo": {"target": "motivo", "type": "str"},
            "C10001_MontoSolicitado": {"target": "monto_solicitado", "type": "money"},
            "C10001_MontoRendido": {"target": "monto_rendido", "type": "money"},
            "C10001_MontoDevueltoReembolsado": {
                "target": "monto_devuelto_reembolsado",
                "type": "money",
            },
            "C10001_Estatus": {"target": "estatus", "type": "str"},
        },
        "legacy_pk": "C10001_NumSolicitud",
        "dependency_layer": 2,
    },
    "tbl_C10001_MovimentoCaja": {
        "target_schema": "administracion",
        "target_table": "movimiento_caja",
        "columns": {
            "C10001_NumMovimiento": {"target": "legacy_id", "type": "int_to_str"},
            "C10001_FechaMovimiento": {
                "target": "fecha_movimiento",
                "type": "datetime",
            },
            "C10001_NumCaja": {"target": "numero_caja", "type": "str"},
            "C10001_Rubro": {"target": "rubro", "type": "str"},
            "C10001_Fecha": {"target": "fecha", "type": "date"},
            "C10001_RUC": {"target": "ruc", "type": "str"},
            "C10001_RazonSocial": {"target": "razon_social", "type": "str"},
            "C10001_TipoDocumento": {"target": "tipo_documento", "type": "str"},
            "C10001_SerieDocumento": {"target": "serie_documento", "type": "str"},
            "C10001_NumeroDocumento": {"target": "numero_documento", "type": "str"},
            "C10001_Detalle": {"target": "detalle", "type": "str"},
            "C10001_Monto": {"target": "monto", "type": "money"},
            "C10001_EntradaSalida": {"target": "entrada_salida", "type": "str"},
            "C10001_NumSolicitud": {"target": "numero_solicitud", "type": "str"},
            "C10001_RegistradoPor": {"target": "registrado_por", "type": "str"},
            "C10001_FechaRegistro": {"target": "fecha_registro", "type": "datetime"},
            "C10001_AprobadoPor": {"target": "aprobado_por", "type": "str"},
        },
        "legacy_pk": "C10001_NumMovimiento",
        "dependency_layer": 2,
    },
    "tbl_C02091_SeguimientoInspeccionSSOMA": {
        "target_schema": "sst",
        "target_table": "seguimiento_inspeccion_ssoma",
        "columns": {
            "C02091_NumRegistro": {"target": "legacy_id", "type": "int_to_str"},
            "C02091_FechaHallazgo": {"target": "fecha_hallazgo", "type": "datetime"},
            "C02091_LugarHallazgo": {"target": "lugar_hallazgo", "type": "str"},
            "C02091_TipoInspeccion": {"target": "tipo_inspeccion", "type": "str"},
            "C02091_Inspector_DNI": {"target": "inspector_dni", "type": "str"},
            "C02091_Inspector": {"target": "inspector", "type": "str"},
            "C02091_DescripcionHallazgo": {
                "target": "descripcion_hallazgo",
                "type": "str",
            },
            "C02091_LinkFoto": {"target": "link_foto", "type": "str"},
            "C02091_NivelRiesgo": {"target": "nivel_riesgo", "type": "str"},
            "C02091_CausasHallazgo": {"target": "causas_hallazgo", "type": "str"},
            "C02091_ResponsableSubsanacion": {
                "target": "responsable_subsanacion",
                "type": "str",
            },
            "C02091_FechaSubsanacion": {"target": "fecha_subsanacion", "type": "date"},
            "C02091_Estado": {"target": "estado", "type": "str"},
        },
        "legacy_pk": "C02091_NumRegistro",
        "dependency_layer": 2,
    },
    "tbl_C02105_ReporteActoCondicion": {
        "target_schema": "sst",
        "target_table": "reporte_acto_condicion",
        "columns": {
            "C02105_0NumRegistro": {"target": "legacy_id", "type": "int_to_str"},
            "C02105_0FechaRegistro": {"target": "fecha_registro", "type": "datetime"},
            "C02105_0DNI_Registrado": {"target": "registrado_por_dni", "type": "str"},
            "C02105_0RegistradoPor": {"target": "registrado_por", "type": "str"},
            "C02105_0ModificadoPor": {"target": "modificado_por", "type": "str"},
            "C02105_0FechaModificacion": {
                "target": "fecha_modificacion",
                "type": "datetime",
            },
            "G00001_Id_UnidadOperativa": {
                "target": "unidad_operativa_legacy_id",
                "type": "str",
            },
            "C02105_1DNI_Reportado": {"target": "reportado_por_dni", "type": "str"},
            "C02105_1ReportadoPor": {"target": "reportado_por_nombre", "type": "str"},
            "C02105_1Cargo": {"target": "cargo", "type": "str"},
            "C02105_1EmpresaReportante": {
                "target": "empresa_reportante",
                "type": "str",
            },
            "C02105_2FechaEvento": {"target": "fecha_evento", "type": "datetime"},
            "C02105_2Lugar": {"target": "lugar", "type": "str"},
            "C02105_2Empresa": {"target": "empresa", "type": "str"},
            "C02105_2SistemaGestion": {"target": "sistema_gestion", "type": "str"},
            "C02105_2TipoReporte": {"target": "tipo_reporte", "type": "str"},
            "C02105_3CodigoActoCondicion": {
                "target": "codigo_acto_condicion",
                "type": "str",
            },
            "C02105_3ActoCondicion": {"target": "acto_condicion", "type": "str"},
            "C02105_3DañoA": {"target": "dano_a", "type": "str"},
            "C02105_3Descripcion": {"target": "descripcion", "type": "str"},
            "C02105_3ComoActue": {"target": "como_actue", "type": "str"},
            "C02105_4Estado": {"target": "estado", "type": "str"},
            "C02105_5Porque1": {"target": "por_que_1", "type": "str"},
            "C02105_5Porque2": {"target": "por_que_2", "type": "str"},
            "C02105_5Porque3": {"target": "por_que_3", "type": "str"},
            "C02105_5Porque4": {"target": "por_que_4", "type": "str"},
            "C02105_5Porque5": {"target": "por_que_5", "type": "str"},
            "C02105_5AccionCorrectiva": {"target": "accion_correctiva", "type": "str"},
        },
        "legacy_pk": "C02105_0NumRegistro",
        "dependency_layer": 2,
        "notes": "Columns use section prefixes: 0=header, 1=reporter, 2=event, "
        "3=condition, 4=status, 5=analysis.",
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 3 — Tables depending on layer 2
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_C08003_ContratoAdenda": {
        "target_schema": "equipo",
        "target_table": "contrato_adenda",
        "columns": {
            "C08003_IdContratoAdenda": {"target": "legacy_id", "type": "str"},
            "C08003_TipoContratoAdenda": {"target": "tipo", "type": "str"},
            "C08003_NumContrato": {"target": "numero_contrato", "type": "str"},
            "C08001_CodigoEquipo": {"target": "_fk_equipo", "type": "str"},
            "C07001_RUC": {"target": "_fk_proveedor", "type": "str"},
            "C08003_FechaContrato": {"target": "fecha_contrato", "type": "date"},
            "C08003_FechaInicio": {"target": "fecha_inicio", "type": "date"},
            "C08003_FechaFin": {"target": "fecha_fin", "type": "date"},
            "C08003_Moneda": {"target": "moneda", "type": "str"},
            "C08003_Modalidad": {"target": "modalidad", "type": "str"},
            "C08003_TipoTarifa": {"target": "tipo_tarifa", "type": "str"},
            "C08003_Tarifa": {"target": "tarifa", "type": "money"},
            "C08003_MiniPor": {"target": "minimo_por", "type": "str"},
            "C08003_CantidadMinima": {"target": "cantidad_minima", "type": "float"},
            "C08003_Estatus": {"target": "estado", "type": "str"},
        },
        "legacy_pk": "C08003_IdContratoAdenda",
        "dependency_layer": 3,
    },
    "tbl_C05027_ComportamientoHistorico": {
        "target_schema": "rrhh",
        "target_table": "comportamiento_historico",
        "columns": {
            "C05027_IdComportamientoHistorico": {
                "target": "legacy_id",
                "type": "int_to_str",
            },
            "C05027_Cargo": {"target": "cargo", "type": "str"},
            "C05027_Salario": {"target": "salario", "type": "float"},
            "C05027_FechaInicio": {"target": "fecha_inicio", "type": "date"},
            "C05027_FechaFin": {"target": "fecha_fin", "type": "date"},
            "C05027_NumContrato": {"target": "numero_contrato", "type": "str"},
            "C05027_Id_RegistroTrabajador": {
                "target": "registro_trabajador_legacy_id",
                "type": "int_to_str",
            },
        },
        "legacy_pk": "C05027_IdComportamientoHistorico",
        "dependency_layer": 3,
    },
    "tbl_C05028_Tareo": {
        "target_schema": "rrhh",
        "target_table": "tareo",
        "columns": {
            "C05028_Id_Tareo": {"target": "legacy_id", "type": "int_to_str"},
            "C05027_Id_RegistroTrabajador": {
                "target": "_fk_trabajador_via_registro",
                "type": "int",
            },
            "C05028_Fecha": {"target": "_derive_periodo", "type": "date"},
        },
        "legacy_pk": "C05028_Id_Tareo",
        "dependency_layer": 3,
        "notes": "SPECIAL CASE: Legacy is per-day records, target is period summary. "
        "Conversion script must group by (RegistroTrabajador, month) to create "
        "Tareo period records. C05025_ prefix columns (Tareo, CodigoTareo, etc.) "
        "are metadata about the daily code, not directly mapped.",
    },
    "tbl_C04004_ProgramacionPago": {
        "target_schema": "administracion",
        "target_table": "programacion_pago",
        "columns": {
            "C04004_NumProgramacion": {"target": "legacy_id", "type": "str"},
            "C04004_Estatus": {"target": "estado", "type": "str"},
            "C04004_PPC": {"target": "monto_total", "type": "float"},
            "C04004_Elaboración": {"target": "fecha_programada", "type": "datetime"},
        },
        "legacy_pk": "C04004_NumProgramacion",
        "dependency_layer": 3,
        "notes": "Target has required fields (proveedor_id, periodo) that don't exist "
        "in legacy. Need default values during conversion.",
    },
    "tbl_C04003_AdminCentroCosto": {
        "target_schema": "administracion",
        "target_table": "admin_centro_costo",
        "columns": {
            "C04002_IdCuentaPagar": {
                "target": "cuenta_por_pagar_legacy_id",
                "type": "str",
            },
            "C04003_IdAdminCC": {"target": "item", "type": "int"},
            "C04003_CodComponente": {"target": "codigo_componente", "type": "str"},
            "C04001_CodCentroCosto": {"target": "codigo_centro_costo", "type": "str"},
            "C04003_CentroCosto": {"target": "centro_costo", "type": "str"},
            "C04003_Porcentaje": {"target": "porcentaje", "type": "int"},
            "C04003_MontoFinal": {"target": "monto_final", "type": "money"},
        },
        "legacy_pk": ["C04003_IdAdminCC", "C04002_IdCuentaPagar"],
        "dependency_layer": 3,
        "notes": "Composite PK. No own legacy_id. Uses cuenta_por_pagar_legacy_id for ref.",
    },
    "tbl_C06010_Movimiento": {
        "target_schema": "logistica",
        "target_table": "movimiento",
        "columns": {
            "C06010_NumRegistro": {"target": "legacy_id", "type": "int_to_str"},
            "C06010_FechaOperacion": {"target": "fecha", "type": "date"},
            "SUNAT12_TipoOperacion": {"target": "tipo_movimiento", "type": "str"},
            "C06010_SerieDoc": {"target": "numero_documento", "type": "str"},
            "C06010_Observaciones": {"target": "observaciones", "type": "str"},
        },
        "legacy_pk": "C06010_NumRegistro",
        "dependency_layer": 3,
        "notes": "Large table (~7.6MB, ~27 legacy columns). Most legacy columns unmapped "
        "(equipo refs, EDT refs, transport info). Only core movement data imported.",
    },
    "tbl_C020911_SeguimientoInspeccion": {
        "target_schema": "sst",
        "target_table": "seguimiento_inspeccion",
        "columns": {
            "C020911_NumRegistro": {"target": "legacy_id", "type": "int_to_str"},
            "C020911_Fecha": {"target": "fecha", "type": "date"},
            "C020911_Inspector_DNI": {"target": "inspector_dni", "type": "str"},
            "C020911_Inspector": {"target": "inspector", "type": "str"},
            "C020911_DescripcionInspeccion": {
                "target": "descripcion_inspeccion",
                "type": "str",
            },
            "C020911_LinkEvidencia": {"target": "link_evidencia", "type": "str"},
            "C020911_FechaProximaInspeccion": {
                "target": "fecha_proxima_inspeccion",
                "type": "date",
            },
            "C020911_AvanceEstimado": {"target": "avance_estimado", "type": "int"},
            "C02091_NumRegistro": {
                "target": "seguimiento_ssoma_legacy_id",
                "type": "int_to_str",
            },
        },
        "legacy_pk": "C020911_NumRegistro",
        "dependency_layer": 3,
    },
    "tbl_C04007_FlujoCajaBanco": {
        "target_schema": "administracion",
        "target_table": "flujo_caja_banco",
        "columns": {
            "C04007_IdMovim": {"target": "legacy_id", "type": "str"},
            "C04007_TipoMovimiento": {"target": "tipo_movimiento", "type": "str"},
            "C04007_FechaMovimiento": {"target": "fecha_movimiento", "type": "date"},
            "C04007_NumCuentaOrigen": {"target": "numero_cuenta_origen", "type": "str"},
            "C04007_CuentaOrigen": {"target": "cuenta_origen", "type": "str"},
            "C04007_NumCuentaDestino": {
                "target": "numero_cuenta_destino",
                "type": "str",
            },
            "C04007_CuentaDestino": {"target": "cuenta_destino", "type": "str"},
            "C04007_Concepto": {"target": "concepto", "type": "str"},
            "C04007_Moneda": {"target": "moneda", "type": "str"},
            "C04007_Total": {"target": "total", "type": "money"},
            "C04007_TotalLetra": {"target": "total_letra", "type": "str"},
            "C04007_Voucher": {"target": "voucher", "type": "str"},
            "C04007_LinkVoucher": {"target": "link_voucher", "type": "str"},
            "G00001_Id_UnidadOperativa": {
                "target": "_fk_unidad_operativa",
                "type": "str",
            },
            "C04007_RegistradoPor": {"target": "registrado_por", "type": "str"},
            "C04007_FechaRegistro": {"target": "fecha_registro", "type": "datetime"},
            "C04007_ActualizadoPor": {"target": "actualizado_por", "type": "str"},
            "C04007_FechaActualizacion": {
                "target": "fecha_actualizacion",
                "type": "datetime",
            },
        },
        "legacy_pk": "C04007_IdMovim",
        "dependency_layer": 3,
        "notes": "Large table (~4.6MB).",
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 4 — Tables depending on layer 3
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_C08004_ValorizacionEquipo": {
        "target_schema": "equipo",
        "target_table": "valorizacion_equipo",
        "columns": {
            "C08004_IdValorizacion": {"target": "legacy_id", "type": "str"},
            "C08003_IdContratoAdenda": {"target": "_fk_contrato", "type": "str"},
            "C08004_FechaInicio": {"target": "fecha_inicio", "type": "date"},
            "C08004_FechaFin": {"target": "fecha_fin", "type": "date"},
            "C08004_TipoCambio": {"target": "tipo_cambio", "type": "money"},
            # C08004_Cantidad, C08004_UnidadMedida, C08004_PU_Valorizacion skipped
            # (no equivalent columns in model)
            "C08004_ValorizacionBruta": {"target": "costo_base", "type": "money"},
            "C08004_CantidadCombustible": {
                "target": "combustible_consumido",
                "type": "float",
            },
            # C08004_PrecioCombustible skipped (unit price, no model equivalent)
            "C08004_ImporteCombustible": {
                "target": "costo_combustible",
                "type": "money",
            },
            # C08004_PrecioManipuleoCombustible skipped (unit price, no model equivalent)
            "C08004_ImporteManipuleoCombustible": {
                "target": "importe_manipuleo",
                "type": "money",
            },
            "C08004_ImporteAdelanto": {"target": "importe_adelanto", "type": "money"},
            "C08004_ImporteGastoObra": {
                "target": "importe_gasto_obra",
                "type": "money",
            },
            "C08004_ImporteExcesoCombustible": {
                "target": "importe_exceso_combustible",
                "type": "money",
            },
            "C08004_DescuenteTotal": {"target": "descuento_monto", "type": "money"},
            "C08004_ValorizacionNeta": {"target": "total_valorizado", "type": "money"},
            "C08004_Estatus": {"target": "estado", "type": "str"},
        },
        "derived": {
            "equipo_id": {
                "method": "equipo_from_code_suffix",
                "source_legacy_col": "C08004_IdValorizacion",
            },
            "periodo": {
                "method": "periodo_from_date",
                "source_legacy_col": "C08004_FechaInicio",
            },
        },
        "legacy_pk": "C08004_IdValorizacion",
        "dependency_layer": 4,
        "notes": "equipo_id and periodo derived from IdValorizacion pattern "
        "and FechaInicio respectively. Remapped: ValorizacionBruta→costo_base, "
        "ValorizacionNeta→total_valorizado, CantidadCombustible→combustible_consumido, "
        "ImporteCombustible→costo_combustible, ImporteManipuleoCombustible→importe_manipuleo, "
        "DescuenteTotal→descuento_monto. Skipped: Cantidad, UnidadMedida, "
        "PU_Valorizacion, PrecioCombustible, PrecioManipuleoCombustible (no model equiv).",
    },
    "tbl_C04005_DetalleProgramacionPago": {
        "target_schema": "administracion",
        "target_table": "detalle_programacion_pago",
        "columns": {
            "C04004_NumProgramacion": {
                "target": "_fk_programacion_pago",
                "type": "str",
            },
            "C04005_Item": {"target": "_item", "type": "int"},
            "C04005_Concepto": {"target": "concepto", "type": "str"},
            "C04005_MontoProgramado": {"target": "monto", "type": "money"},
        },
        "legacy_pk": ["C04004_NumProgramacion", "C04005_Item"],
        "has_legacy_id": False,
        "dependency_layer": 4,
        "notes": "Composite PK. No legacy_id on target. programacion_pago_id is required.",
    },
    "tbl_C04008_DetalleMovimiento": {
        "target_schema": "administracion",
        "target_table": "detalle_movimiento_contable",
        "columns": {
            "C04007_IdMovim": {"target": "movimiento_legacy_id", "type": "str"},
            "C04008_Item": {"target": "item", "type": "int"},
            "C04004_NumProgramacion": {
                "target": "programacion_legacy_id",
                "type": "str",
            },
            "C04002_IdCuentaPagar": {
                "target": "cuenta_por_pagar_legacy_id",
                "type": "str",
            },
            "C04008_Concepto": {"target": "concepto", "type": "str"},
            "Clasificacion": {"target": "clasificacion", "type": "str"},
            "C04008_Monto": {"target": "monto", "type": "money"},
        },
        "legacy_pk": [
            "C04007_IdMovim",
            "C04008_Item",
            "C04004_NumProgramacion",
            "C04002_IdCuentaPagar",
        ],
        "has_legacy_id": False,
        "dependency_layer": 4,
        "notes": "4-column composite PK. Large table (~1.8MB). "
        "Uses legacy_id strings for all references.",
    },
    "tbl_C05032_EDTTareo": {
        "target_schema": "rrhh",
        "target_table": "edt_tareo",
        "columns": {
            "C05032_Id_EdtTareo": {"target": "legacy_id", "type": "int_to_str"},
            "A02001_Id_EDT": {"target": "_fk_edt", "type": "int"},
            "C05028_Id_Tareo": {"target": "_fk_tareo", "type": "int"},
            "C05032_Horas": {"target": "horas", "type": "float"},
        },
        "legacy_pk": "C05032_Id_EdtTareo",
        "dependency_layer": 4,
    },
    "tbl_C06011_DetalleMovimiento": {
        "target_schema": "logistica",
        "target_table": "detalle_movimiento",
        "columns": {
            "C06011_NumDetalleMovi": {"target": "_runtime_pk", "type": "int"},
            "C06010_NumRegistro": {"target": "_fk_movimiento", "type": "int"},
            "C06011_IdProducto": {"target": "_fk_producto", "type": "str"},
            "C06011_Cantidad": {"target": "cantidad", "type": "float"},
            "C06011_CU": {"target": "precio_unitario", "type": "money"},
            "C06011_CT": {"target": "monto_total", "type": "money"},
        },
        "legacy_pk": "C06011_NumDetalleMovi",
        "has_legacy_id": False,
        "dependency_layer": 4,
        "notes": "Large table (~6.4MB). No legacy_id on target. "
        "movimiento_id and producto_id are required NOT NULL FKs.",
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 5 — Tables depending on layer 4
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_C08005_ParteDiario": {
        "target_schema": "equipo",
        "target_table": "parte_diario",
        "columns": {
            "C08005_IdParteDiario": {"target": "legacy_id", "type": "str"},
            "C08005_NumParteDiario": {"target": "numero_parte", "type": "int"},
            "C08005_Fecha": {"target": "fecha", "type": "date"},
            "C08005_DNI_Operador": {"target": "_fk_trabajador", "type": "str"},
            "C08005_Operador": {"target": "_operador_nombre", "type": "str"},
            "C08005_Turno": {"target": "turno", "type": "str"},
            # C08005_HorometroOdometro skipped (no direct model equivalent)
            "C08005_Inicial": {"target": "horometro_inicial", "type": "float"},
            "C08005_Final": {"target": "horometro_final", "type": "float"},
            # C08005_Diferencia skipped (computed: Final - Inicial)
            "C08005_DescuentoPorCalentamiento": {
                "target": "horas_precalentamiento",
                "type": "float",
            },
            # C08005_OtrosDescuentos skipped (no model equivalent)
            "C08005_CantidadEfectiva": {"target": "horas_trabajadas", "type": "float"},
            # C08005_DescuentoCantidadMinima, C08005_CantidadMinima skipped (no model equiv)
            # C08005_Actividad skipped (no model equivalent)
            "C08004_IdValorizacion": {"target": "_fk_valorizacion", "type": "str"},
        },
        "derived": {
            "equipo_id": {
                "method": "equipo_from_code_suffix",
                "source_legacy_col": "C08004_IdValorizacion",
            },
        },
        "legacy_pk": "C08005_IdParteDiario",
        "dependency_layer": 5,
        "notes": "Large table (~13.7MB). equipo_id derived from "
        "C08004_IdValorizacion code pattern. Remapped: "
        "Inicial→horometro_inicial, Final→horometro_final, "
        "DescuentoPorCalentamiento→horas_precalentamiento, "
        "CantidadEfectiva→horas_trabajadas. Skipped: HorometroOdometro, "
        "Diferencia, OtrosDescuentos, DescuentoCantidadMinima, "
        "CantidadMinima, Actividad (no model equiv).",
    },
    "tbl_C08002_AdelantoAmortizacion": {
        "target_schema": "equipo",
        "target_table": "adelanto_amortizacion",
        "columns": {
            "C08002_Id_AdelantoAmortizacion": {"target": "_runtime_pk", "type": "int"},
            "C08002_TipoOperacion": {"target": "tipo_operacion", "type": "str"},
            # DB column name is fecha_operacion (via name= in model)
            "C08002_FechaOperacion": {"target": "fecha_operacion", "type": "date"},
            # DB column name is num_documento (via name= in model)
            "C08002_NumDocumento": {"target": "num_documento", "type": "str"},
            "C08002_Concepto": {"target": "concepto", "type": "str"},
            # DB column name is num_cuota (via name= in model)
            "C08002_NumCuota": {"target": "num_cuota", "type": "str"},
            "C08002_Monto": {"target": "monto", "type": "money"},
            "C08001_CodigoEquipo": {"target": "_fk_equipo", "type": "str"},
            "C08004_IdValorizacion": {"target": "_fk_valorizacion", "type": "str"},
        },
        "legacy_pk": "C08002_Id_AdelantoAmortizacion",
        "has_legacy_id": False,
        "dependency_layer": 5,
        "notes": "No legacy_id on target. DB column names differ from model attr names "
        "(fecha→fecha_operacion, numero_documento→num_documento, "
        "numero_cuota→num_cuota). Two source files: this + _002 variant.",
    },
    "tbl_C08002_AdelantoAmortizacion_002": {
        "target_schema": "equipo",
        "target_table": "adelanto_amortizacion",
        "columns": {
            "C08002_Id_AdelantoAmortizacion": {"target": "_runtime_pk", "type": "int"},
            "C08002_TipoOperacion": {"target": "tipo_operacion", "type": "str"},
            "C08002_FechaOperacion": {"target": "fecha_operacion", "type": "date"},
            "C08002_NumDocumento": {"target": "num_documento", "type": "str"},
            "C08002_Concepto": {"target": "concepto", "type": "str"},
            "C08002_NumCuota": {"target": "num_cuota", "type": "str"},
            "C08002_Monto": {"target": "monto", "type": "money"},
            "C08001_CodigoEquipo": {"target": "_fk_equipo", "type": "str"},
            "C08004_IdValorizacion": {"target": "_fk_valorizacion", "type": "str"},
        },
        "legacy_pk": "C08002_Id_AdelantoAmortizacion",
        "has_legacy_id": False,
        "dependency_layer": 5,
        "notes": "Second batch of data for same target table as tbl_C08002.",
    },
    "tbl_C08008_EquipoGastoObra": {
        "target_schema": "equipo",
        "target_table": "gasto_en_obra",
        "columns": {
            "C08008_IdGastoObra": {"target": "_runtime_pk", "type": "int"},
            "C08004_IdValorizacion": {"target": "_fk_valorizacion", "type": "str"},
            "C08008_FechaOperacion": {"target": "fecha", "type": "date"},
            "C08008_Proveedor": {"target": "proveedor", "type": "str"},
            "C08008_Concepto": {"target": "concepto", "type": "str"},
            "C08008_TipoDocumento": {"target": "tipo_documento", "type": "str"},
            "C08008_NumDocumento": {"target": "numero_documento", "type": "str"},
            "C08008_Importe": {"target": "importe", "type": "money"},
            "C08008_IncluyeIGV": {"target": "incluye_igv", "type": "str_to_bool"},
            "C08008_ImporteSinIGV": {"target": "importe_sin_igv", "type": "money"},
        },
        "defaults": {"tenant_id": 1},
        "legacy_pk": "C08008_IdGastoObra",
        "has_legacy_id": False,
        "dependency_layer": 5,
        "notes": "No legacy_id. valorizacion_id is required NOT NULL. "
        "Source columns use C08008_FechaOperacion and C08008_NumDocumento.",
    },
    "tbl_C08010_ExcesoCombustible": {
        "target_schema": "equipo",
        "target_table": "analisis_combustible",
        "columns": {
            "C08010_IdExcesoCombustible": {"target": "_runtime_pk", "type": "int"},
            "C08004_IdValorizacion": {"target": "_fk_valorizacion", "type": "str"},
            "C08010_ConsumoCombustible": {
                "target": "consumo_combustible",
                "type": "money",
            },
            "C08010_TipoHorometroOdometro": {
                "target": "tipo_horometro_odometro",
                "type": "str",
            },
            "C08010_LecturaInicio": {"target": "lectura_inicio", "type": "float"},
            "C08010_LecturaFinal": {"target": "lectura_final", "type": "float"},
            "C08010_TotalUso": {"target": "total_uso", "type": "float"},
            "C08010_Rendimiento": {"target": "rendimiento", "type": "float"},
            "C08010_RatioControl": {"target": "ratio_control", "type": "float"},
            "C08010_Diferencia": {"target": "diferencia", "type": "float"},
            "C08010_ExcesoCombustible": {
                "target": "exceso_combustible",
                "type": "float",
            },
            "C08010_PrecioUnitario": {"target": "precio_unitario", "type": "float"},
            "C08010_ImporteExceso": {"target": "importe_exceso", "type": "float"},
        },
        "legacy_pk": "C08010_IdExcesoCombustible",
        "has_legacy_id": False,
        "dependency_layer": 5,
        "notes": "No legacy_id. valorizacion_id is required NOT NULL.",
    },
    "tbl_C08007_EquipoCombustible": {
        "target_schema": "equipo",
        "target_table": "equipo_combustible",
        "columns": {
            "C08007_IdValeSalida": {"target": "legacy_id", "type": "str"},
            "C08004_IdValorizacion": {
                "target": "valorizacion_legacy_id",
                "type": "str",
            },
            "C08007_NumValeSalida": {"target": "numero_vale_salida", "type": "int"},
            "C08007_Fecha": {"target": "fecha", "type": "date"},
            "C08007_HorometroOdometro": {
                "target": "horometro_odometro",
                "type": "float",
            },
            "C08007_Inicial": {"target": "inicial", "type": "float"},
            "C08007_Cantidad": {"target": "cantidad", "type": "float"},
            "C08007_PrecioUnitarioSinIGV": {
                "target": "precio_unitario_sin_igv",
                "type": "money",
            },
            "C08007_Importe": {"target": "importe", "type": "money"},
            "C08007_Comentario": {"target": "comentario", "type": "str"},
        },
        "legacy_pk": "C08007_IdValeSalida",
        "dependency_layer": 5,
        "notes": "Large table (~2.0MB).",
    },
    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 6 — Tables depending on layer 5
    # ═══════════════════════════════════════════════════════════════════════
    "tbl_C08006_EquipoEDT": {
        "target_schema": "equipo",
        "target_table": "equipo_edt",
        "columns": {
            "C08006_IdEquipoEDT": {"target": "legacy_id", "type": "int_to_str"},
            "C08005_IdParteDiario": {"target": "parte_diario_legacy_id", "type": "str"},
            "C08006_Porcentaje": {"target": "porcentaje", "type": "float"},
            "A02001_Id_EDT": {"target": "_fk_edt", "type": "int"},
            "C08006_EDT": {"target": "edt_nombre", "type": "str"},
            "C08006_Actividad": {"target": "actividad", "type": "str"},
        },
        "legacy_pk": "C08006_IdEquipoEDT",
        "dependency_layer": 6,
        "notes": "Large table (~3.4MB).",
    },
}


# Tables intentionally NOT mapped (with reasons)
SKIPPED_TABLES = {
    "tbl_C06008_CuadroComparativa": "Single-column table (int), no PK, no useful data",
    "tbl_G00003_UsuarioRol": "Older version of UsuarioRolUnidadOperativa, "
    "data duplicated in tbl_G00003_UsuarioRolUnidadOperativa",
}


def get_tables_by_layer() -> dict[int, list[str]]:
    """Return table names grouped by dependency layer, sorted."""
    layers: dict[int, list[str]] = {}
    for table_name, mapping in MAPPINGS.items():
        layer = mapping["dependency_layer"]
        layers.setdefault(layer, []).append(table_name)
    return dict(sorted(layers.items()))


def get_fk_columns(table_name: str) -> list[str]:
    """Return columns that need FK resolution (prefixed with _fk_)."""
    mapping = MAPPINGS.get(table_name, {})
    return [
        col
        for col, spec in mapping.get("columns", {}).items()
        if isinstance(spec["target"], str) and spec["target"].startswith("_fk_")
    ]
