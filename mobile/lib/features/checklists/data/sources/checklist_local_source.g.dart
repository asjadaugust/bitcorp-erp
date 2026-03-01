// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checklist_local_source.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(checklistLocalSource)
final checklistLocalSourceProvider = ChecklistLocalSourceProvider._();

final class ChecklistLocalSourceProvider
    extends
        $FunctionalProvider<
          ChecklistLocalSource,
          ChecklistLocalSource,
          ChecklistLocalSource
        >
    with $Provider<ChecklistLocalSource> {
  ChecklistLocalSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'checklistLocalSourceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$checklistLocalSourceHash();

  @$internal
  @override
  $ProviderElement<ChecklistLocalSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ChecklistLocalSource create(Ref ref) {
    return checklistLocalSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ChecklistLocalSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ChecklistLocalSource>(value),
    );
  }
}

String _$checklistLocalSourceHash() =>
    r'885ca0261e3d923d88527f79fe2e86b18c9efe20';
