// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval_action_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ApprovalAction)
final approvalActionProvider = ApprovalActionProvider._();

final class ApprovalActionProvider
    extends $AsyncNotifierProvider<ApprovalAction, void> {
  ApprovalActionProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalActionProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalActionHash();

  @$internal
  @override
  ApprovalAction create() => ApprovalAction();
}

String _$approvalActionHash() => r'cde4451d84b6de6356472cf1a2138b89505e1182';

abstract class _$ApprovalAction extends $AsyncNotifier<void> {
  FutureOr<void> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<void>, void>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<void>, void>,
              AsyncValue<void>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
