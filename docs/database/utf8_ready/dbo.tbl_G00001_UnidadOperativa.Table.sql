USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00001_UnidadOperativa]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00001_UnidadOperativa](
	[G00001_Id_UnidadOperativa] [varchar](7) NOT NULL,
	[G00001_CodigoUnidadOperativa] [varchar](10) NULL,
	[G00001_UnidadOperativa] [varchar](50) NULL,
	[G00001_Proyecto] [varchar](200) NULL,
 CONSTRAINT [PK_tbl_000_UnidadOperativa] PRIMARY KEY CLUSTERED 
(
	[G00001_Id_UnidadOperativa] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_G00001_UnidadOperativa] ([G00001_Id_UnidadOperativa], [G00001_CodigoUnidadOperativa], [G00001_UnidadOperativa], [G00001_Proyecto]) VALUES (N'01.OCL', N'OCL', N'OFICINA CENTRAL LIMA', N'OFICINA CENTRAL LIMA')
INSERT [dbo].[tbl_G00001_UnidadOperativa] ([G00001_Id_UnidadOperativa], [G00001_CodigoUnidadOperativa], [G00001_UnidadOperativa], [G00001_Proyecto]) VALUES (N'04.CCU', N'CCU', N'CONSORCIO CUTERVO', N'CONSORCIO CUTERVO bla bla bla')
INSERT [dbo].[tbl_G00001_UnidadOperativa] ([G00001_Id_UnidadOperativa], [G00001_CodigoUnidadOperativa], [G00001_UnidadOperativa], [G00001_Proyecto]) VALUES (N'06.CAA', N'CAA', N'CONSORCIO ALVAC ARAMSA', N'CONSORCIO ALVAC ARAMSA bla bla bla')
GO
