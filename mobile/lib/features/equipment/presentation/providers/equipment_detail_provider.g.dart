// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(EquipmentDetail)
final equipmentDetailProvider = EquipmentDetailFamily._();

final class EquipmentDetailProvider
    extends $AsyncNotifierProvider<EquipmentDetail, EquipmentDetailModel> {
  EquipmentDetailProvider._({
    required EquipmentDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'equipmentDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$equipmentDetailHash();

  @override
  String toString() {
    return r'equipmentDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  EquipmentDetail create() => EquipmentDetail();

  @override
  bool operator ==(Object other) {
    return other is EquipmentDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$equipmentDetailHash() => r'08b8334b94876c30eee5af0277cdc63d592ce16c';

final class EquipmentDetailFamily extends $Family
    with
        $ClassFamilyOverride<
          EquipmentDetail,
          AsyncValue<EquipmentDetailModel>,
          EquipmentDetailModel,
          FutureOr<EquipmentDetailModel>,
          String
        > {
  EquipmentDetailFamily._()
    : super(
        retry: null,
        name: r'equipmentDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  EquipmentDetailProvider call(String id) =>
      EquipmentDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'equipmentDetailProvider';
}

abstract class _$EquipmentDetail extends $AsyncNotifier<EquipmentDetailModel> {
  late final _$args = ref.$arg as String;
  String get id => _$args;

  FutureOr<EquipmentDetailModel> build(String id);
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<AsyncValue<EquipmentDetailModel>, EquipmentDetailModel>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<EquipmentDetailModel>,
                EquipmentDetailModel
              >,
              AsyncValue<EquipmentDetailModel>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, () => build(_$args));
  }
}
