# Service Audit: ExportService

**File**: `backend/src/services/export.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent  
**Status**: ⚠️ Issues Found

---

## Overview

- **Lines of Code**: 36
- **Public Methods**: 1 (`generateExcel`)
- **Has Tests**: ❌ No (`export.service.spec.ts` not found)
- **Test Coverage**: 0% (no tests exist)
- **Complexity**: 🟢 Simple (pure utility service for Excel generation)

---

## Service Characteristics

**Type**: Utility Service (not data-access)
**Purpose**: Generate Excel files from data arrays and stream to HTTP response
**Used By**: `reporting.controller.ts` (utilization, maintenance, inventory reports)

**Key Difference**: This is NOT a data-access service. It doesn't query databases or manage entities. It's a pure utility function for Excel generation.

---

## Error Handling Analysis

### Current Pattern

```typescript
async generateExcel(
  data: any[],
  columns: { header: string; key: string; width?: number }[],
  sheetName: string,
  res: Response,
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;
  worksheet.addRows(data);

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}
```

### Issues Found

- [x] **No Try/Catch**: No error handling at all
- [x] **No Logging**: Silent failures, no debugging info
- [x] **No Input Validation**: Doesn't validate empty data, columns, etc.
- [ ] **Generic Errors**: N/A (no error handling)
- [ ] **No Error Codes**: N/A (no error handling)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';
import { ValidationError } from '../errors/validation.error';

async generateExcel(
  data: unknown[],
  columns: { header: string; key: string; width?: number }[],
  sheetName: string,
  res: Response,
  fileName: string
): Promise<void> {
  try {
    Logger.info('Generating Excel file', {
      sheetName,
      fileName,
      rowCount: data.length,
      columnCount: columns.length,
      context: 'ExportService.generateExcel',
    });

    // Input validation
    if (!data || data.length === 0) {
      throw new ValidationError('Cannot export empty data', {
        sheetName,
        fileName,
      });
    }

    if (!columns || columns.length === 0) {
      throw new ValidationError('Cannot export without columns', {
        sheetName,
        fileName,
      });
    }

    if (!sheetName || sheetName.trim() === '') {
      throw new ValidationError('Sheet name is required', {
        fileName,
      });
    }

    if (!fileName || fileName.trim() === '') {
      throw new ValidationError('File name is required', {
        sheetName,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    Logger.info('Excel file generated successfully', {
      sheetName,
      fileName,
      rowCount: data.length,
      columnCount: columns.length,
      context: 'ExportService.generateExcel',
    });
  } catch (error) {
    Logger.error('Error generating Excel file', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sheetName,
      fileName,
      context: 'ExportService.generateExcel',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (add validation + logging)

---

## Return Type Analysis

### Current Pattern

```typescript
async generateExcel(...): Promise<void> // ❌ No explicit return type
```

### Issues Found

- [x] **Missing Return Type**: No explicit `Promise<void>`
- [ ] **Returns Raw Entities**: N/A (utility service, doesn't return data)
- [ ] **Missing Transformations**: N/A (streams directly to response)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
async generateExcel(
  data: unknown[],
  columns: { header: string; key: string; width?: number }[],
  sheetName: string,
  res: Response,
  fileName: string
): Promise<void> {  // ✅ Explicit return type
  // ...
}
```

**Effort**: 🟢 Small (add return type annotation)

---

## Tenant Context Analysis

### Current Pattern

```typescript
async generateExcel(
  data: any[],  // ❌ No tenantId parameter
  // ...
)
```

### Issues Found

- [x] **No Tenant Parameter**: Method doesn't accept `tenantId`
- [ ] **Missing Tenant Filter**: N/A (utility service, no DB access)
- [ ] **Cross-Tenant Risk**: N/A (no data access)

### Analysis

**Question**: Should this utility service have tenant context?

**Answer**: **NO** - This is a **pure utility service** that:

- Doesn't access the database
- Doesn't query entities
- Only transforms data to Excel format
- Data comes from caller (already filtered by tenant)

**Recommendation**: Keep as-is. Tenant filtering happens in the calling controller/service, not here.

**Effort**: 🟢 None (tenant context not applicable)

---

## Type Safety Analysis

### Current Pattern

```typescript
async generateExcel(
  data: any[],  // ❌ any type
  columns: { header: string; key: string; width?: number }[],
  sheetName: string,
  res: Response,
  fileName: string
)
```

### Issues Found

- [x] **Uses `any` Type**: `data: any[]` should be `data: unknown[]`
- [ ] **Missing Type Guards**: No type validation for data array

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// Define interface for column configuration
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

async generateExcel(
  data: unknown[],  // ✅ Use unknown instead of any
  columns: ExcelColumn[],  // ✅ Use interface
  sheetName: string,
  res: Response,
  fileName: string
): Promise<void> {
  // ...
}
```

**Effort**: 🟢 Small (change any to unknown, extract interface)

---

## Business Logic Analysis

### Current Business Rules

1. **Header Styling**: Headers are bold with gray background
2. **Column Configuration**: Supports custom column width
3. **XLSX Format**: Generates `.xlsx` files (Excel 2007+)

### Issues Found

- [x] **No Input Validation**: Doesn't validate empty data or columns
- [x] **No File Name Sanitization**: Doesn't sanitize fileName for special characters
- [ ] **No Business Rules**: N/A (pure utility function)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

async generateExcel(
  data: unknown[],
  columns: ExcelColumn[],
  sheetName: string,
  res: Response,
  fileName: string
): Promise<void> {
  try {
    // Validation: Data
    if (!data || data.length === 0) {
      throw new ValidationError('Cannot export empty data', {
        sheetName,
        fileName,
      });
    }

    // Validation: Columns
    if (!columns || columns.length === 0) {
      throw new ValidationError('Cannot export without columns', {
        sheetName,
        fileName,
      });
    }

    // Validation: Sheet name
    if (!sheetName || sheetName.trim() === '') {
      throw new ValidationError('Sheet name is required', {
        fileName,
      });
    }

    // Validation: File name (sanitize)
    if (!fileName || fileName.trim() === '') {
      throw new ValidationError('File name is required', {
        sheetName,
      });
    }

    // Sanitize file name (remove special characters)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');

    // ... rest of logic

    res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFileName}.xlsx`);

    // ...
  } catch (error) {
    // ...
  }
}
```

**Effort**: 🟢 Small (add validation)

---

## Logging Analysis

### Current Logging

```typescript
// ❌ NO LOGGING AT ALL
async generateExcel(...) {
  // ... 24 lines of logic
  // No Logger.info on success
  // No Logger.error on failure
}
```

### Issues Found

- [x] **No Logging**: Service has no logging at all
- [x] **Missing Context**: N/A (no logs)
- [x] **No Error Logging**: Errors not logged before re-throwing
- [x] **No Success Logging**: Successful operations not logged

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async generateExcel(
  data: unknown[],
  columns: ExcelColumn[],
  sheetName: string,
  res: Response,
  fileName: string
): Promise<void> {
  try {
    Logger.info('Generating Excel file', {
      sheetName,
      fileName,
      rowCount: data.length,
      columnCount: columns.length,
      context: 'ExportService.generateExcel',
    });

    // ... Excel generation logic

    Logger.info('Excel file generated successfully', {
      sheetName,
      fileName,
      rowCount: data.length,
      columnCount: columns.length,
      context: 'ExportService.generateExcel',
    });
  } catch (error) {
    Logger.error('Error generating Excel file', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sheetName,
      fileName,
      context: 'ExportService.generateExcel',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (add log statements)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`export.service.spec.ts` not found)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Missing Happy Path Tests**: Excel generation not tested
- [x] **Missing Error Tests**: Error handling not tested
- [x] **No Validation Tests**: Input validation not tested

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// export.service.spec.ts

import { ExportService } from './export.service';
import { Response } from 'express';
import { ValidationError } from '../errors/validation.error';

describe('ExportService', () => {
  let service: ExportService;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    service = new ExportService();

    // Mock Express Response
    mockResponse = {
      setHeader: jest.fn(),
      end: jest.fn(),
      write: jest.fn(),
    };
  });

  describe('generateExcel', () => {
    it('should generate Excel file successfully', async () => {
      const data = [
        { id: 1, name: 'Item 1', quantity: 10 },
        { id: 2, name: 'Item 2', quantity: 20 },
      ];

      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 15 },
      ];

      await service.generateExcel(
        data,
        columns,
        'Test Sheet',
        mockResponse as Response,
        'test-file'
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=test-file.xlsx'
      );

      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should throw ValidationError if data is empty', async () => {
      const columns = [{ header: 'ID', key: 'id' }];

      await expect(
        service.generateExcel([], columns, 'Test', mockResponse as Response, 'test')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if columns are empty', async () => {
      const data = [{ id: 1 }];

      await expect(
        service.generateExcel(data, [], 'Test', mockResponse as Response, 'test')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if sheet name is empty', async () => {
      const data = [{ id: 1 }];
      const columns = [{ header: 'ID', key: 'id' }];

      await expect(
        service.generateExcel(data, columns, '', mockResponse as Response, 'test')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if file name is empty', async () => {
      const data = [{ id: 1 }];
      const columns = [{ header: 'ID', key: 'id' }];

      await expect(
        service.generateExcel(data, columns, 'Test', mockResponse as Response, '')
      ).rejects.toThrow(ValidationError);
    });

    it('should sanitize file name with special characters', async () => {
      const data = [{ id: 1 }];
      const columns = [{ header: 'ID', key: 'id' }];

      await service.generateExcel(
        data,
        columns,
        'Test',
        mockResponse as Response,
        'my file@2024!.xlsx'
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=my_file_2024_.xlsx'
      );
    });
  });
});
```

**Effort**: 🟡 Medium (comprehensive test suite, ~1.5 hours)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No Error Handling**: No try/catch, silent failures
2. **No Logging**: No logging at all (debugging impossible)
3. **No Input Validation**: Doesn't validate empty data/columns

### Important Issues (Fix Next) 🟡

1. **Type Safety**: Uses `any` instead of `unknown`
2. **Missing Return Type**: No explicit `Promise<void>`
3. **No Tests**: 0% test coverage

### Nice to Have (Optional) 🟢

1. **File Name Sanitization**: Remove special characters from fileName
2. **Column Interface**: Extract `ExcelColumn` interface
3. **Configurable Styling**: Make header styling customizable

---

## Action Plan

### Step 1: Add Error Handling & Logging (30 min)

- [ ] Import `Logger` and `ValidationError`
- [ ] Wrap logic in try/catch
- [ ] Add `Logger.info` at start
- [ ] Add `Logger.info` on success
- [ ] Add `Logger.error` in catch block

### Step 2: Add Input Validation (30 min)

- [ ] Validate data not empty
- [ ] Validate columns not empty
- [ ] Validate sheetName not empty
- [ ] Validate fileName not empty
- [ ] Sanitize fileName (remove special chars)

### Step 3: Fix Type Safety (15 min)

- [ ] Change `any[]` to `unknown[]`
- [ ] Extract `ExcelColumn` interface
- [ ] Add explicit `Promise<void>` return type

### Step 4: Testing (1.5 hours - optional for now)

- [ ] Create test file
- [ ] Add happy path test (Excel generation)
- [ ] Add validation tests (empty data, columns, names)
- [ ] Add file name sanitization test

---

## Estimated Total Effort

**Overall Complexity**: 🟢 Simple (1.5-2 hours)

**Breakdown**:

- Error Handling + Logging: 30 min
- Input Validation: 30 min
- Type Safety: 15 min
- Tests (deferred): 1.5 hours

**Total**: ~1.5 hours (excluding tests)

**Recommended Approach**:

1. Add error handling + logging (foundation)
2. Add input validation (prevent errors)
3. Fix type safety (lint compliance)
4. Tests (can batch-create later)

---

## Special Notes

**Tenant Context Decision**: ❌ NOT APPLICABLE

This is a **pure utility service** that:

- Doesn't access the database
- Doesn't manage entities
- Only formats data to Excel
- Data comes from caller (already tenant-filtered)

**Recommendation**: Do NOT add tenant context. Keep as stateless utility function.

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Found**: 9 issues (3 critical, 3 important, 3 nice-to-have)  
**Issues Fixed**: 0 / 9  
**Tests Added**: ❌ No  
**Test Coverage**: 0%  
**All Tests Passing**: N/A  
**Ready for Production**: ❌ No

---

**Next Service**: `report.service.ts` (Priority 1 - Simple, read-only, 109 LOC)
