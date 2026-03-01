import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';

class AppShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AeroTheme.primary100, // Matches scaffold background rule
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AeroTheme.primary500, // Active interaction color
        unselectedItemColor: AeroTheme.grey700,
        backgroundColor: Colors.white,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Reportes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_gas_station_outlined),
            activeIcon: Icon(Icons.local_gas_station),
            label: 'Vales',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fact_check_outlined),
            activeIcon: Icon(Icons.fact_check),
            label: 'Checklists',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.verified_user_outlined),
            activeIcon: Icon(Icons.verified_user),
            label: 'Aprobaciones',
          ),
        ],
      ),
    );
  }
}
