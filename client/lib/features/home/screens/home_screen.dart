import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
                height: 100,
                child: DrawerHeader(
                    child: TextButton.icon(
                  label: const Text('Settings'),
                  icon: const Icon(Icons.settings),
                  onPressed: () {
                    context.push('/settings');
                  },
                )),
              )
            ],
          ),
        ));
  }
}
