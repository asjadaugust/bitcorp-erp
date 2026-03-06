USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C06001_Categoria]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C06001_Categoria](
	[C06001_IdCategoria] [varchar](3) NOT NULL,
	[C06001_Categoria] [varchar](50) NULL,
	[C06001_Descripcion] [varchar](50) NULL,
 CONSTRAINT [PK_tbl_C06001_Categoria] PRIMARY KEY CLUSTERED 
(
	[C06001_IdCategoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'ACE', N'ACERO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'ACF', N'ACTIVO FIJO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'ACG', N'ACEITE Y GRASA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'AGR', N'AGREGADO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'ALC', N'ALCANTARILLA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'ASF', N'ASFALTO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'BOT', N'BOTIQUIN', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'CAF', N'IMPLEMENTO DE CAMPAMENTO FERRETERIA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'CAV', N'IMPLEMENTO DE CAMPAMENTO VIVIENDA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'CEM', N'CEMENTO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'COM', N'COMBUSTIBLE', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'EPP', N'EPP', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'EQE', N'EQUIPOS DE EMERGENCIA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'EXP', N'EXPLOSIVOS', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'FER', N'FERRETERIA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'FIL', N'FILTROS', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'GEM', N'REPUESTO DE GEM', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'HER', N'HERRAMIENTA MANUAL', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'LIM', N'LIMPIEZA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'MAD', N'MADERA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'PIN', N'PINTURA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'SEN', N'SEÑALIZACION', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'TUB', N'TUBERIA', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'UTE', N'UTILES DE ESCRITORIO', NULL)
INSERT [dbo].[tbl_C06001_Categoria] ([C06001_IdCategoria], [C06001_Categoria], [C06001_Descripcion]) VALUES (N'VIV', N'VIVERES', NULL)
GO
