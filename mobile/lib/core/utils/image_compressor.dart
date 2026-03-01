import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

class ImageCompressor {
  /// Compresses the image and returns the path to the compressed file.
  /// Targets ~1920px max dimension to save bandwidth over cellular networks.
  static Future<File?> compressImage(File file) async {
    final dir = await getTemporaryDirectory();
    final targetPath =
        '${dir.absolute.path}/temp_${DateTime.now().millisecondsSinceEpoch}.jpg';

    var result = await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      targetPath,
      quality: 80,
      minWidth: 1920,
      minHeight: 1920,
    );

    if (result != null) {
      return File(result.path);
    }
    return null;
  }
}
