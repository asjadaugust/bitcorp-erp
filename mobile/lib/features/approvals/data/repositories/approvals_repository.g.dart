// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approvals_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(approvalsRepository)
final approvalsRepositoryProvider = ApprovalsRepositoryProvider._();

final class ApprovalsRepositoryProvider
    extends
        $FunctionalProvider<
          ApprovalsRepository,
          ApprovalsRepository,
          ApprovalsRepository
        >
    with $Provider<ApprovalsRepository> {
  ApprovalsRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalsRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalsRepositoryHash();

  @$internal
  @override
  $ProviderElement<ApprovalsRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ApprovalsRepository create(Ref ref) {
    return approvalsRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ApprovalsRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ApprovalsRepository>(value),
    );
  }
}

String _$approvalsRepositoryHash() =>
    r'a97b8657035466604b907887ffa3964d9f742b0d';
