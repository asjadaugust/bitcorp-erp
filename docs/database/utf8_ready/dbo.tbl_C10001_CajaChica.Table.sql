USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C10001_CajaChica]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C10001_CajaChica](
	[C10001_NumCaja] [varchar](10) NOT NULL,
	[C10001_SaldoInicial] [money] NULL,
	[C10001_IngresoTotal] [money] NULL,
	[C10001_SalidaTotal] [money] NULL,
	[C10001_SaldoFinal] [money] NULL,
	[C10001_FechaApertura] [date] NULL,
	[C10001_FechaCierre] [date] NULL,
	[C10001_Estatus] [varchar](20) NULL,
 CONSTRAINT [PK_tbl_C10001_CajaChica] PRIMARY KEY CLUSTERED 
(
	[C10001_NumCaja] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2020.12_01', 0.0000, 1000.0000, 961.9800, 38.0200, CAST(N'2020-12-15' AS Date), CAST(N'2021-01-29' AS Date), N'CERRADO')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.01_02', 38.0200, 962.0000, NULL, NULL, CAST(N'2021-01-29' AS Date), NULL, N'DISPONIBLE')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.03_25', 5.8300, 995.0000, 860.9000, 139.9300, CAST(N'2021-03-25' AS Date), CAST(N'2021-05-11' AS Date), N'CERRADO')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.05_01', 139.9300, 1000.0000, NULL, NULL, CAST(N'2021-05-11' AS Date), NULL, N'DISPONIBLE')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.06_11', -99.5200, 964.0000, NULL, NULL, CAST(N'2021-06-11' AS Date), NULL, N'DISPONIBLE')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.08_02', -50.9200, 578.5000, NULL, NULL, CAST(N'2021-08-05' AS Date), NULL, N'DISPONIBLE')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.09_14', 1.8800, 1000.0000, NULL, NULL, CAST(N'2021-09-24' AS Date), NULL, N'DISPONIBLE')
INSERT [dbo].[tbl_C10001_CajaChica] ([C10001_NumCaja], [C10001_SaldoInicial], [C10001_IngresoTotal], [C10001_SalidaTotal], [C10001_SaldoFinal], [C10001_FechaApertura], [C10001_FechaCierre], [C10001_Estatus]) VALUES (N'2021.10_20', 84.8000, 1000.0000, NULL, NULL, CAST(N'2021-11-25' AS Date), NULL, N'DISPONIBLE')
GO
