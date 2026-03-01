// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'valorizations_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(valorizationsRepository)
final valorizationsRepositoryProvider = ValorizationsRepositoryProvider._();

final class ValorizationsRepositoryProvider
    extends
        $FunctionalProvider<
          ValorizationsRepository,
          ValorizationsRepository,
          ValorizationsRepository
        >
    with $Provider<ValorizationsRepository> {
  ValorizationsRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'valorizationsRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$valorizationsRepositoryHash();

  @$internal
  @override
  $ProviderElement<ValorizationsRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ValorizationsRepository create(Ref ref) {
    return valorizationsRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ValorizationsRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ValorizationsRepository>(value),
    );
  }
}

String _$valorizationsRepositoryHash() =>
    r'797687ed5f84307b85bd77c7ec8422856c817d12';
