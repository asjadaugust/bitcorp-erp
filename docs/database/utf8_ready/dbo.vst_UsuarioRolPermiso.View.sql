USE [dbBitCorp]
GO
/****** Object:  View [dbo].[vst_UsuarioRolPermiso]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[vst_UsuarioRolPermiso]
AS
SELECT        dbo.tbl_G00002_Usuario.G00002_DNI, dbo.tbl_G00002_Usuario.G00002_Usuario, dbo.tbl_G00004_Rol.G00004_Rol, dbo.tbl_G00006_Permiso.G00006_Permiso, dbo.tbl_G00006_Permiso.G00006_Proceso
FROM            dbo.tbl_G00002_Usuario INNER JOIN
                         dbo.tbl_G00003_UsuarioRol ON dbo.tbl_G00002_Usuario.G00002_DNI = dbo.tbl_G00003_UsuarioRol.G00002_DNI INNER JOIN
                         dbo.tbl_G00004_Rol ON dbo.tbl_G00003_UsuarioRol.G00004_Id_Rol = dbo.tbl_G00004_Rol.G00004_Id_Rol INNER JOIN
                         dbo.tbl_G00005_RolPermiso ON dbo.tbl_G00004_Rol.G00004_Id_Rol = dbo.tbl_G00005_RolPermiso.G00004_Id_Rol INNER JOIN
                         dbo.tbl_G00006_Permiso ON dbo.tbl_G00005_RolPermiso.G00006_Id_Permiso = dbo.tbl_G00006_Permiso.G00006_Id_Permiso
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
         Begin Table = "tbl_G00002_Usuario (dbo)"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 274
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tbl_G00003_UsuarioRol (dbo)"
            Begin Extent = 
               Top = 185
               Left = 309
               Bottom = 298
               Right = 517
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tbl_G00004_Rol (dbo)"
            Begin Extent = 
               Top = 3
               Left = 500
               Bottom = 122
               Right = 708
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tbl_G00005_RolPermiso (dbo)"
            Begin Extent = 
               Top = 197
               Left = 722
               Bottom = 310
               Right = 930
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tbl_G00006_Permiso (dbo)"
            Begin Extent = 
               Top = 0
               Left = 960
               Bottom = 160
               Right = 1168
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
      Begin ColumnWidths = 9
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = ' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'vst_UsuarioRolPermiso'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane2', @value=N'
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'vst_UsuarioRolPermiso'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=2 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'vst_UsuarioRolPermiso'
GO
