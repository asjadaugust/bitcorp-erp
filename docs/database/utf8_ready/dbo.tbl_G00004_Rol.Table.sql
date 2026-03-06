USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00004_Rol]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00004_Rol](
	[G00004_Id_Rol] [int] IDENTITY(1,1) NOT NULL,
	[G00004_Rol] [varchar](50) NULL,
 CONSTRAINT [PK_000_Rol] PRIMARY KEY CLUSTERED 
(
	[G00004_Id_Rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_G00004_Rol] ON 

INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (1, N'OCL_Contador')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (2, N'OCL_Usuario')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (3, N'CAA_Almacenero')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (4, N'CORP_ProveedorSelecEvalu')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (5, N'CORP_ProveedorEvalua')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (6, N'Responsable SSOMA')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (7, N'ReportadorRAC')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (8, N'CAA_Usuario')
INSERT [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol], [G00004_Rol]) VALUES (9, N'CAA_Responsable_GEM')
SET IDENTITY_INSERT [dbo].[tbl_G00004_Rol] OFF
GO
