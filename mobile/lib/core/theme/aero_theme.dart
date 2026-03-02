import 'package:flutter/material.dart';

class AeroTheme {
  // Color Palette (Strict Hex Codes)
  static const Color primary900 = Color(0xFF072B45); // Primary Text
  static const Color primary500 = Color(0xFF0077CD); // Interactive Elements
  static const Color primary100 = Color(0xFFEBF3F8); // App Background
  static const Color grey100 = Color(0xFFF6F7F8); // Card Backgrounds
  static const Color grey200 = Color(0xFFEAECF0); // Custom mapped grey
  static const Color white = Color(0xFFFFFFFF);
  static const Color accent500 = Color(0xFFE37222); // Destructive Actions
  static const Color semanticBlue100 = Color(0xFFD1E9FA); // Mapped semantics
  static const Color semanticBlue500 = Color(0xFF006FC9); // Informative/Badges
  static const Color grey300 = Color(0xFFD0D5DD); // Input Borders
  static const Color grey500 = Color(0xFF667085); // Secondary Text/Icons
  static const Color grey700 = Color(0xFF344054); // Darker Grey for inactive
  static const Color semanticGreen500 = Color(0xFF12B76A); // Success
  // Semantics & Opacity
  static const Color modalOverlay = Color(0xE6072B45); // 90% opacity

  // Spacing (Multiples of 4)
  static const double spacing4 = 4.0;
  static const double spacing8 = 8.0;
  static const double spacing12 = 12.0;
  static const double spacing16 = 16.0;
  static const double spacing20 = 20.0;
  static const double spacing24 = 24.0;
  static const double spacing32 = 32.0;

  // Border Radius
  static const double radiusSm = 4.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 16.0;

  // Typography
  static const String headingFont = 'Universal Sans Display';
  static const String bodyFont = 'Universal Sans';

  static ThemeData get lightTheme {
    return ThemeData(
      scaffoldBackgroundColor: primary100,
      colorScheme: const ColorScheme.light(
        primary: primary500,
        surface: primary100,
        error: accent500,
        onPrimary: white,
        onSurface: primary900,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontFamily: headingFont,
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: primary900,
        ),
        displayMedium: TextStyle(
          fontFamily: headingFont,
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: primary900,
        ),
        bodyLarge: TextStyle(
          fontFamily: bodyFont,
          fontSize: 16,
          color: primary900,
        ),
        bodyMedium: TextStyle(
          fontFamily: bodyFont,
          fontSize: 14,
          color: primary900,
        ),
        labelSmall: TextStyle(
          fontFamily: bodyFont,
          fontSize: 12,
          color: primary900,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: grey300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: grey300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: primary500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: accent500),
        ),
        labelStyle: const TextStyle(
          fontFamily: bodyFont,
          color: primary900,
          fontSize: 14,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary500,
          foregroundColor: white,
          minimumSize: const Size(double.infinity, 48), // 48x48dp minimum
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(
            fontFamily: bodyFont,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
