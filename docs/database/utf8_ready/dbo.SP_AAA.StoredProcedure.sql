USE [dbBitCorp]
GO
/****** Object:  StoredProcedure [dbo].[SP_AAA]    Script Date: 3/4/2026 11:33:44 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      <Author, , Name>
-- Create Date: <Create Date, , >
-- Description: <Description, , >
-- =============================================
CREATE PROCEDURE [dbo].[SP_AAA]

AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from
 --01
SELECT        C04002_IdCuentaPagar, C04002_DNI_RUC, C04002_RazonSocial, C04002_FechaEmision, C04002_Comprobante, C04002_Serie, C04002_Numero, C04002_Concepto, C04002_Moneda, C04002_MontoSinIGV, C04002_MontoIGV, 
                         C04002_MontoConIGV, C04002_PorceDetraccion, C04002_MontoDetraccion, C04002_MontoRetencion, C04002_MontoFinal, C04002_FechaRegistro
FROM            dbo.tbl_C04002_CuentasPorPagar

END
GO
