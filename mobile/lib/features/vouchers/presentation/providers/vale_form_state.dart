import 'package:freezed_annotation/freezed_annotation.dart';

part 'vale_form_state.freezed.dart';

@freezed
class ValeFormState with _$ValeFormState {
  const factory ValeFormState({
    @Default('') String numeroVale,
    @Default('Diesel') String tipoCombustible, // Diesel, Gasolina
    @Default('') String cantidadGalones,
    @Default('') String precioUnitario,
    @Default('') String idEquipo,
    @Default('') String fotoPath,
    @Default('') String notas,
    @Default(false) bool isSubmitting,
    String? error,
  }) = _ValeFormState;

  const ValeFormState._();

  bool get isValid {
    final qty = double.tryParse(cantidadGalones);
    return numeroVale.isNotEmpty &&
        idEquipo.isNotEmpty &&
        fotoPath.isNotEmpty &&
        qty != null &&
        qty > 0;
  }
}
