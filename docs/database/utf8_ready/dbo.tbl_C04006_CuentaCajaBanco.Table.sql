USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C04006_CuentaCajaBanco]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C04006_CuentaCajaBanco](
	[C04005_NumCuenta] [varchar](20) NOT NULL,
	[C04005_Cuenta] [varchar](50) NULL,
	[C04005_AccesoProyecto] [varchar](2) NULL,
	[G00001_Id_UnidadOperativa] [varchar](7) NULL,
	[C04005_Estatus] [varchar](10) NULL,
 CONSTRAINT [PK_tbl_CuentaCajaBanco] PRIMARY KEY CLUSTERED 
(
	[C04005_NumCuenta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C04006_CuentaCajaBanco] ([C04005_NumCuenta], [C04005_Cuenta], [C04005_AccesoProyecto], [G00001_Id_UnidadOperativa], [C04005_Estatus]) VALUES (N'0000001', N'CAJA CHICA', N'SÍ', N'04.CCU', N'ACTIVO')
INSERT [dbo].[tbl_C04006_CuentaCajaBanco] ([C04005_NumCuenta], [C04005_Cuenta], [C04005_AccesoProyecto], [G00001_Id_UnidadOperativa], [C04005_Estatus]) VALUES (N'1912566762080', N'BCP CUENTA PRINCIPAL', N'SÍ', N'04.CCU', N'NO ACTIVO')
INSERT [dbo].[tbl_C04006_CuentaCajaBanco] ([C04005_NumCuenta], [C04005_Cuenta], [C04005_AccesoProyecto], [G00001_Id_UnidadOperativa], [C04005_Estatus]) VALUES (N'1912577777777', N'BCP ADMINISTRADOR MIGUEL MENA', N'SÍ', N'04.CCU', N'ACTIVO')
INSERT [dbo].[tbl_C04006_CuentaCajaBanco] ([C04005_NumCuenta], [C04005_Cuenta], [C04005_AccesoProyecto], [G00001_Id_UnidadOperativa], [C04005_Estatus]) VALUES (N'1912599999999', N'BANBIF OCL', N'NO', N'01.OCL', N'ACTIVO')
GO
