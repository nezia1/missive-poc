import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:poc_flutter_client/features/authentication/providers/auth_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.title});

  final String title;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          backgroundColor: Theme.of(context).colorScheme.inversePrimary,
          title: Text(widget.title),
        ),
        drawer: Drawer(
          backgroundColor: Theme.of(context).canvasColor,
          child: ListView(
            children: [
              SizedBox(
                height: 70,
                child: DrawerHeader(
                    child: TextButton.icon(
                  label: const Text('Settings'),
                  icon: const Icon(Icons.settings),
                  onPressed: () {
                    context.push('/settings');
                  },
                )),
              ),
              SizedBox(
                height: 70,
                child: DrawerHeader(
                    child: TextButton.icon(
                        label: const Text('Logout'),
                        icon: const Icon(Icons.logout),
                        onPressed: () {
                          Provider.of<AuthProvider>(context, listen: false)
                              .logout();
                        })),
              ),
            ],
          ),
        ));
  }
}
