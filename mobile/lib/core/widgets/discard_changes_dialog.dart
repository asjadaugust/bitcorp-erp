import 'package:flutter/material.dart';
import 'package:mobile/core/theme/aero_theme.dart';

/// Shows a discard-changes confirmation dialog.
/// Returns `true` if the user confirms discarding, `false` otherwise.
Future<bool> showDiscardChangesDialog(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('¿Descartar cambios?'),
      content: const Text(
        'Tienes cambios sin guardar. ¿Seguro que deseas salir?',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: TextButton.styleFrom(foregroundColor: AeroTheme.accent500),
          child: const Text('Descartar'),
        ),
      ],
    ),
  );
  return result ?? false;
}
