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
    r'8746be0c463c6c27fd5fdb4ceba0289c1fd6af0d';

@ProviderFor(availableEquipment)
final availableEquipmentProvider = AvailableEquipmentProvider._();

final class AvailableEquipmentProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<EquipmentListItem>>,
          List<EquipmentListItem>,
          FutureOr<List<EquipmentListItem>>
        >
    with
        $FutureModifier<List<EquipmentListItem>>,
        $FutureProvider<List<EquipmentListItem>> {
  AvailableEquipmentProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'availableEquipmentProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$availableEquipmentHash();

  @$internal
  @override
  $FutureProviderElement<List<EquipmentListItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<EquipmentListItem>> create(Ref ref) {
    return availableEquipment(ref);
  }
}

String _$availableEquipmentHash() =>
    r'efa4efa6e7449f2c3011f43ffb48a90c8873a565';
