// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(equipmentRepository)
final equipmentRepositoryProvider = EquipmentRepositoryProvider._();

final class EquipmentRepositoryProvider
    extends
        $FunctionalProvider<
          EquipmentRepository,
          EquipmentRepository,
          EquipmentRepository
        >
    with $Provider<EquipmentRepository> {
  EquipmentRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'equipmentRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$equipmentRepositoryHash();

  @$internal
  @override
  $ProviderElement<EquipmentRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  EquipmentRepository create(Ref ref) {
    return equipmentRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(EquipmentRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<EquipmentRepository>(value),
    );
  }
}

String _$equipmentRepositoryHash() =>
    r'6df8e018ff7620c4b5d90b3f06c7b7611f063164';
