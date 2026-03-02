import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

class ImageCompressor {
  static Future<File?> compressFile(File file) async {
    final dir = await getTemporaryDirectory();
    final targetPath = '${dir.path}/${const Uuid().v4()}.jpg';

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
