import 'package:mobile/features/vouchers/data/repositories/vale_combustible_repository.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:mobile/features/vouchers/presentation/providers/vale_form_state.dart';
import 'package:mobile/features/vouchers/presentation/providers/vale_list_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

part 'vale_form_provider.g.dart';

@riverpod
class ValeForm extends _$ValeForm {
  @override
  ValeFormState build() {
    return const ValeFormState();
  }

  void updateNumeroVale(String value) =>
      state = state.copyWith(numeroVale: value, error: null);
  void updateTipoCombustible(String value) =>
      state = state.copyWith(tipoCombustible: value, error: null);
  void updateCantidadGalones(String value) =>
      state = state.copyWith(cantidadGalones: value, error: null);
  void updatePrecioUnitario(String value) =>
      state = state.copyWith(precioUnitario: value, error: null);
  void updateEquipo(String value) =>
      state = state.copyWith(idEquipo: value, error: null);
  void updateFotoPath(String value) =>
      state = state.copyWith(fotoPath: value, error: null);
  void updateNotas(String value) =>
      state = state.copyWith(notas: value, error: null);

  Future<bool> submit() async {
    if (!state.isValid) {
      state = state.copyWith(
        error: 'Por favor, complete todos los campos requeridos correctamente.',
      );
      return false;
    }

    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final repository = ref.read(valeCombustibleRepositoryProvider);

      final double cantidad = double.parse(state.cantidadGalones);
      final double? precio = state.precioUnitario.isEmpty
          ? null
          : double.tryParse(state.precioUnitario);

      final vale = ValeCombustibleModel(
        id: const Uuid().v4(),
        numeroVale: state.numeroVale,
        fecha: DateTime.now(),
        tipoCombustible: state.tipoCombustible,
        cantidadGalones: cantidad,
        precioUnitario: precio,
        equipoId: state.idEquipo,
        fotoPath: state.fotoPath,
        observaciones: state.notas.isEmpty ? null : state.notas,
        estado: 'PENDIENTE',
        syncStatus: 'PENDING_SYNC',
      );

      await repository.saveValeCombustible(vale);

      // Refresh the list
      ref.invalidate(valeListProvider);

      state = state.copyWith(isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al guardar el vale: ${e.toString()}',
      );
      return false;
    }
  }
}
