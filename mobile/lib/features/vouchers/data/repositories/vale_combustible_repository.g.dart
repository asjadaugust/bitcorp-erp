// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_combustible_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(valeCombustibleRepository)
final valeCombustibleRepositoryProvider = ValeCombustibleRepositoryProvider._();

final class ValeCombustibleRepositoryProvider
    extends
        $FunctionalProvider<
          ValeCombustibleRepository,
          ValeCombustibleRepository,
          ValeCombustibleRepository
        >
    with $Provider<ValeCombustibleRepository> {
  ValeCombustibleRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valeCombustibleRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valeCombustibleRepositoryHash();

  @$internal
  @override
  $ProviderElement<ValeCombustibleRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ValeCombustibleRepository create(Ref ref) {
    return valeCombustibleRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ValeCombustibleRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ValeCombustibleRepository>(value),
    );
  }
}

String _$valeCombustibleRepositoryHash() =>
    r'0cdb10ddf7d6b98875c0dad53fca369571ae4add';
