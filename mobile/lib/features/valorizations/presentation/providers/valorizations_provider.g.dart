// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'valorizations_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(Valorizations)
final valorizationsProvider = ValorizationsProvider._();

final class ValorizationsProvider
    extends $AsyncNotifierProvider<Valorizations, List<ValorizationModel>> {
  ValorizationsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valorizationsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valorizationsHash();

  @$internal
  @override
  Valorizations create() => Valorizations();
}

String _$valorizationsHash() => r'a3c1db8a3804e71400a627b127befb8b78d61995';

abstract class _$Valorizations extends $AsyncNotifier<List<ValorizationModel>> {
  FutureOr<List<ValorizationModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<
              AsyncValue<List<ValorizationModel>>,
              List<ValorizationModel>
            >;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ValorizationModel>>,
                List<ValorizationModel>
              >,
              AsyncValue<List<ValorizationModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
