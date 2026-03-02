// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_form_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ValeForm)
final valeFormProvider = ValeFormProvider._();

final class ValeFormProvider
    extends $NotifierProvider<ValeForm, ValeFormState> {
  ValeFormProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valeFormProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valeFormHash();

  @$internal
  @override
  ValeForm create() => ValeForm();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ValeFormState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ValeFormState>(value),
    );
  }
}

String _$valeFormHash() => r'adb09ac7f8fff2790fd604567929f81a99ebda20';

abstract class _$ValeForm extends $Notifier<ValeFormState> {
  ValeFormState build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<ValeFormState, ValeFormState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<ValeFormState, ValeFormState>,
              ValeFormState,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
