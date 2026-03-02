import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:mobile/core/theme/aero_theme.dart';

/// Reusable shimmer loading list for consistent loading states.
class ShimmerLoadingList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;

  const ShimmerLoadingList({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 100,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AeroTheme.spacing16),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: AeroTheme.grey200,
          highlightColor: Colors.white,
          child: Card(
            margin: const EdgeInsets.only(bottom: AeroTheme.spacing16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
            ),
            child: SizedBox(height: itemHeight, width: double.infinity),
          ),
        );
      },
    );
  }
}
