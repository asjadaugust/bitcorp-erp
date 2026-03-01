// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approvals_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(RecibidosList)
final recibidosListProvider = RecibidosListProvider._();

final class RecibidosListProvider
    extends $AsyncNotifierProvider<RecibidosList, List<ApprovalRequestModel>> {
  RecibidosListProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'recibidosListProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$recibidosListHash();

  @$internal
  @override
  RecibidosList create() => RecibidosList();
}

String _$recibidosListHash() => r'7fc07efc05b3ba2067b8c57db1cb58aa2b9db70e';

abstract class _$RecibidosList
    extends $AsyncNotifier<List<ApprovalRequestModel>> {
  FutureOr<List<ApprovalRequestModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<
              AsyncValue<List<ApprovalRequestModel>>,
              List<ApprovalRequestModel>
            >;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ApprovalRequestModel>>,
                List<ApprovalRequestModel>
              >,
              AsyncValue<List<ApprovalRequestModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(EnviadosList)
final enviadosListProvider = EnviadosListProvider._();

final class EnviadosListProvider
    extends $AsyncNotifierProvider<EnviadosList, List<ApprovalRequestModel>> {
  EnviadosListProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'enviadosListProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$enviadosListHash();

  @$internal
  @override
  EnviadosList create() => EnviadosList();
}

String _$enviadosListHash() => r'af17defb9b6287a2a21a966892f7fbfda6528cb0';

abstract class _$EnviadosList
    extends $AsyncNotifier<List<ApprovalRequestModel>> {
  FutureOr<List<ApprovalRequestModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<
              AsyncValue<List<ApprovalRequestModel>>,
              List<ApprovalRequestModel>
            >;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ApprovalRequestModel>>,
                List<ApprovalRequestModel>
              >,
              AsyncValue<List<ApprovalRequestModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(receivedCount)
final receivedCountProvider = ReceivedCountProvider._();

final class ReceivedCountProvider extends $FunctionalProvider<int, int, int>
    with $Provider<int> {
  ReceivedCountProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'receivedCountProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$receivedCountHash();

  @$internal
  @override
  $ProviderElement<int> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  int create(Ref ref) {
    return receivedCount(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(int value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<int>(value),
    );
  }
}

String _$receivedCountHash() => r'1f40a23ce716ba10cb8ad6c5f1c6cc188fbf5ba2';
