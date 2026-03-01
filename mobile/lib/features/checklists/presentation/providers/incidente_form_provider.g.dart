// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'incidente_form_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(IncidenteForm)
final incidenteFormProvider = IncidenteFormProvider._();

final class IncidenteFormProvider
    extends $NotifierProvider<IncidenteForm, IncidenteFormState> {
  IncidenteFormProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'incidenteFormProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$incidenteFormHash();

  @$internal
  @override
  IncidenteForm create() => IncidenteForm();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(IncidenteFormState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<IncidenteFormState>(value),
    );
  }
}

String _$incidenteFormHash() => r'87cea2f2b6818f602780b2534ed0e9a02b91b4d9';

abstract class _$IncidenteForm extends $Notifier<IncidenteFormState> {
  IncidenteFormState build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<IncidenteFormState, IncidenteFormState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<IncidenteFormState, IncidenteFormState>,
              IncidenteFormState,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
