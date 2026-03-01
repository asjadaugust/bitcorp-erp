// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_list_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ValeList)
final valeListProvider = ValeListProvider._();

final class ValeListProvider
    extends $AsyncNotifierProvider<ValeList, List<ValeCombustibleModel>> {
  ValeListProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valeListProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valeListHash();

  @$internal
  @override
  ValeList create() => ValeList();
}

String _$valeListHash() => r'2ad67639b471e2329cdc4e769471c8e29b77ee9a';

abstract class _$ValeList extends $AsyncNotifier<List<ValeCombustibleModel>> {
  FutureOr<List<ValeCombustibleModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<
              AsyncValue<List<ValeCombustibleModel>>,
              List<ValeCombustibleModel>
            >;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ValeCombustibleModel>>,
                List<ValeCombustibleModel>
              >,
              AsyncValue<List<ValeCombustibleModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
