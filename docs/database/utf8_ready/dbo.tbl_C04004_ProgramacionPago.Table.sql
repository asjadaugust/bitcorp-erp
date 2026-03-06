USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C04004_ProgramacionPago]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C04004_ProgramacionPago](
	[C04004_NumProgramacion] [varchar](11) NOT NULL,
	[C04004_ElaboradoPor] [varchar](100) NULL,
	[C04004_Elaboración] [datetime] NULL,
	[C04004_RevisadoPor] [varchar](100) NULL,
	[C04004_Revision] [datetime] NULL,
	[C04004_AprobadoPor] [varchar](100) NULL,
	[C04004_Aprobacion] [datetime] NULL,
	[C04004_LinkPDF] [varchar](100) NULL,
	[G00001_Id_UnidadOperativa] [varchar](7) NULL,
	[C04004_Actualizado] [datetime] NULL,
	[C04004_ActualizadoPor] [varchar](100) NULL,
	[C04004_Estatus] [varchar](10) NULL,
	[C04004_PPC] [decimal](3, 2) NULL,
 CONSTRAINT [PK_tbl_C04004_ProgramacionPago] PRIMARY KEY CLUSTERED 
(
	[C04004_NumProgramacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C04004_ProgramacionPago] ([C04004_NumProgramacion], [C04004_ElaboradoPor], [C04004_Elaboración], [C04004_RevisadoPor], [C04004_Revision], [C04004_AprobadoPor], [C04004_Aprobacion], [C04004_LinkPDF], [G00001_Id_UnidadOperativa], [C04004_Actualizado], [C04004_ActualizadoPor], [C04004_Estatus], [C04004_PPC]) VALUES (N'01.OCL_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'01.OCL', NULL, NULL, NULL, CAST(0.23 AS Decimal(3, 2)))
INSERT [dbo].[tbl_C04004_ProgramacionPago] ([C04004_NumProgramacion], [C04004_ElaboradoPor], [C04004_Elaboración], [C04004_RevisadoPor], [C04004_Revision], [C04004_AprobadoPor], [C04004_Aprobacion], [C04004_LinkPDF], [G00001_Id_UnidadOperativa], [C04004_Actualizado], [C04004_ActualizadoPor], [C04004_Estatus], [C04004_PPC]) VALUES (N'04.CCU_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'04.CCU', CAST(N'2021-12-20T17:46:06.000' AS DateTime), N'47403012_JOSUE GILMAR CARHUARICRA ALANIA', N'APROBADO', CAST(0.26 AS Decimal(3, 2)))
INSERT [dbo].[tbl_C04004_ProgramacionPago] ([C04004_NumProgramacion], [C04004_ElaboradoPor], [C04004_Elaboración], [C04004_RevisadoPor], [C04004_Revision], [C04004_AprobadoPor], [C04004_Aprobacion], [C04004_LinkPDF], [G00001_Id_UnidadOperativa], [C04004_Actualizado], [C04004_ActualizadoPor], [C04004_Estatus], [C04004_PPC]) VALUES (N'04.CCU_002', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'04.CCU', CAST(N'2022-01-06T09:15:56.000' AS DateTime), N'47403012_JOSUE GILMAR CARHUARICRA ALANIA', N'ELABORADO', NULL)
GO
