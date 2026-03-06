USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00006_Permiso]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00006_Permiso](
	[G00006_Id_Permiso] [int] IDENTITY(1,1) NOT NULL,
	[G00006_Proceso] [varchar](50) NULL,
	[G00006_Modulo] [varchar](50) NULL,
	[G00006_Permiso] [varchar](50) NULL,
 CONSTRAINT [PK_000_PermisoRol] PRIMARY KEY CLUSTERED 
(
	[G00006_Id_Permiso] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_G00006_Permiso] ON 

INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (1, N'310. Contabilidad', N'001. CajaChica', N'310_001_Usuario')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (2, N'310. Contabilidad', N'001. CajaChica', N'310_001_Responsable_Caja_Chica')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (7, N'306. Logistica', N'001.Logistica', N'306_001_Solicitar_Material')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (8, N'306. Logistica', N'001.Logistica', N'306_001_Hacer_Requerimiento')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (9, N'306. Logistica', N'001.Logistica', N'306_001_Aprobar_Requerimiento_Admin_Proyecto')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (10, N'306. Logistica', N'001.Logistica', N'306_001_Aprobar_Requerimiento_Jefe_Proyecto')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (11, N'306. Logistica', N'001.Logistica', N'306_001_Decidir_Lugar_Compra')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (12, N'306. Logistica', N'001.Logistica', N'306_001_Comprar_OCL')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (13, N'306. Logistica', N'001.Logistica', N'306_001_Comprar_Proyecto')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (14, N'306. Logistica', N'001.Logistica', N'306_001_Gestionar_Almacen')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (15, N'306. Logistica', N'001.Logistica', N'306_001_Gestionar_Inventario')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (16, N'306. Logistica', N'001.Logistica', N'306_001_Usuario')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (17, N'307. Gestion Proveedores', N'001.Proveedores', N'307_001_Usuario')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (18, N'307. Gestion Proveedores', N'001.Proveedores', N'307_001_SeleccionarProveedor')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (19, N'307. Gestion Proveedores', N'001.Proveedores', N'307_001_EvaluarProveedor')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (20, N'307. Gestion Proveedores', N'001.Proveedores', N'307_001_EditarInformacionFinanciera')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (21, N'302. SST', N'105. Reporte de Acto y Condicion', N'302_105_UsuarioSoloRAC')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (22, N'302.SST', N'105. Reporte de Acto y Condicion', N'302_105_EditorMaster')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (23, N'302.SST', N'000.SST', N'306_000_UsuarioSST')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (24, N'000', N'000', N'000_PermisoTemporal')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (25, N'308_GEM', N'Frm_308_001_Equipo', N'Frm_308_001_Equipo_Nuevo')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (26, N'308_GEM', N'Frm_308_001_Equipo', N'Frm_308_001_Equipo_Editar')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (27, N'308_GEM', N'Rol_308', N'Rol_308_001_Usuario')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (28, N'308_GEM', N'Frm_308_003_ContratoAdenda', N'Frm_308_003_ContratoAdenda_Nuevo')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (29, N'308_GEM', N'Frm_308_003_ContratoAdenda', N'Frm_308_003_ContratoAdenda_Editar')
INSERT [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso], [G00006_Proceso], [G00006_Modulo], [G00006_Permiso]) VALUES (30, N'306. Logistica', N'Frm_306_902_RegistroMovimiento', N'Frm_306_902_EditarRegistroHistorico')
SET IDENTITY_INSERT [dbo].[tbl_G00006_Permiso] OFF
GO
