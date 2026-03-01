// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_combustible_local_source.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(valeCombustibleLocalSource)
final valeCombustibleLocalSourceProvider =
    ValeCombustibleLocalSourceProvider._();

final class ValeCombustibleLocalSourceProvider
    extends
        $FunctionalProvider<
          ValeCombustibleLocalSource,
          ValeCombustibleLocalSource,
          ValeCombustibleLocalSource
        >
    with $Provider<ValeCombustibleLocalSource> {
  ValeCombustibleLocalSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valeCombustibleLocalSourceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valeCombustibleLocalSourceHash();

  @$internal
  @override
  $ProviderElement<ValeCombustibleLocalSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ValeCombustibleLocalSource create(Ref ref) {
    return valeCombustibleLocalSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ValeCombustibleLocalSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ValeCombustibleLocalSource>(value),
    );
  }
}

String _$valeCombustibleLocalSourceHash() =>
    r'1ff8bf43087ba36f0b8b49ef4f7bc3f9d5c7b633';
