import 'package:mobile/features/vouchers/data/repositories/vale_combustible_repository.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'vale_list_provider.g.dart';

@riverpod
class ValeList extends _$ValeList {
  @override
  FutureOr<List<ValeCombustibleModel>> build() async {
    return _fetchVales();
  }

  Future<List<ValeCombustibleModel>> _fetchVales() async {
    final repository = ref.watch(valeCombustibleRepositoryProvider);
    return await repository.getValesCombustible();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final vales = await _fetchVales();
      state = AsyncValue.data(vales);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
