// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checklist_list_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ChecklistList)
final checklistListProvider = ChecklistListProvider._();

final class ChecklistListProvider
    extends $AsyncNotifierProvider<ChecklistList, List<ChecklistModel>> {
  ChecklistListProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'checklistListProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$checklistListHash();

  @$internal
  @override
  ChecklistList create() => ChecklistList();
}

String _$checklistListHash() => r'ee219bb893b8bff7329674dcd89ba755b733bce1';

abstract class _$ChecklistList extends $AsyncNotifier<List<ChecklistModel>> {
  FutureOr<List<ChecklistModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<AsyncValue<List<ChecklistModel>>, List<ChecklistModel>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<ChecklistModel>>,
                List<ChecklistModel>
              >,
              AsyncValue<List<ChecklistModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
